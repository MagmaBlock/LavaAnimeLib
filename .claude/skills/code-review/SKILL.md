---
name: code-review
description: 审查待提交的 git 变更：检查 BUG、测试覆盖、类型错误和项目规范违反
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: pre-commit
---

## 执行流程

按以下步骤**顺序执行**：

### 1. 了解变更内容
- 运行 `git diff --cached`（及 `--stat` 摘要）查看已暂存变更，若无则改用 `git diff`。
- 区分出新增、修改、删除的文件，按分层分组（routes / controllers / services / common / tasks / tests）。

### 2. 检查测试覆盖
- 对每个新增或修改的源文件（controllers / services / routes / middleware / common / schemas），检查 `tests/` 下是否有对应的测试文件。
  - 镜像源路径：例如 `services/v2/anime/file.ts` → `tests/unit/file-service.test.ts` 或 `tests/integration/`。测试文件使用扁平命名（如 `tests/unit/user.test.ts`、`tests/unit/password.test.ts`），不严格对应源文件层级。
- 如果测试存在，验证其是否覆盖了变更的逻辑（新函数、新分支）。
- 如果有重要的新逻辑但没有对应测试，标记为警告。

### 3. 运行类型检查
- 仅当变更包含 `.ts` 文件时执行 `pnpm typecheck`，否则跳过。
- 报告发现的任何类型错误。

### 4. 运行完整测试套件
- 仅当变更涉及 `controllers/`、`services/`、`routes/`、`middleware/`、`common/`、`tests/` 下的文件时执行 `pnpm test`（vitest run），否则跳过。
- 报告任何测试失败。对于每个失败，阅读相关的测试和源文件进行诊断。

### 5. 检查变更文件中的常见问题

扫描每个变更的文件并标记以下问题：

| 问题 | 检查内容 |
|------|----------|
| **层级违规** | `services/` 或 `common/` 不得导入 `controllers/`、`routes/`、`middleware/`、`tasks/`。检查 import 路径。 |
| **调试残留** | `console.log`、`console.debug`、`console.trace`、`debugger` 语句 |
| **TODO / FIXME** | 非测试代码中的遗留 `TODO`、`FIXME`、`HACK`、`XXX` 注释 |
| **硬编码密钥** | 源代码中的 API 密钥、密码、令牌、连接字符串（不应在 `config/` 之外） |
| **原始 SQL 注入** | SQL 查询中的字符串拼接（应使用 mysql2 `?` 占位符的参数化查询） |
| **空 catch 块** | `catch (e) {}` 或 `catch { }` 未做错误处理 |
| **响应格式** | API 响应应使用 `common/response/` 的辅助函数（`success()`、`badRequest()`、`notFound()` 等），而不是直接 `res.json()` |
| **命名规范** | 文件应使用 `kebab-case.ts`，函数应使用 `camelCase`。对照 AGENTS.md 中的规范检查。 |
| **缺少错误传递** | 异步路由处理器应有 `.catch(next)` 或被 try/catch 包裹后调用 `next(error)` |
| **导入风格** | 使用 ESM 导入（`import ... from ...`），不使用 `require()`。类型导入使用 `import type`。 |

### 6. 检查 Schema 校验

如果变更涉及请求处理器或路由：
- 验证 `schemas/v2/` 下是否存在与路由对应的请求校验 schema。
- Schema 应使用 `zod` 进行校验。
- 检查 controller 是否使用该 schema 校验输入。

### 7. 编写提交信息

根据变更内容编写一条规范的 Git commit message，格式如下：
```
<type>(<scope>): <简短描述>

<详细说明（可选）>
```
- type: feat / fix / refactor / chore / docs / test / style
- scope: 对应模块名，如 anime、user、search、admin 等

**注意：只编写 message，不要执行 `git commit`。** 如果用户要求提交，再使用这条 message 执行 commit。

**重要：审查全程只报告问题，不要自行修复任何代码。** 除非用户明确要求，否则不做任何改动。

### 8. 汇总结果

给出清晰的汇总报告：
```
## 审查结果

### 文件变更
- 新增: file1.ts, file2.ts
- 修改: file3.ts
- 删除: file4.ts

### 类型检查: ✅/❌
### 单元测试: ✅/⚠️ 缺失 xx 的测试 / ❌ 失败
### 问题列表
- ⚠️ [层级违规] services/v2/anime/list.ts:5 导入了 controllers/v2/anime
- ❌ [调试残留] controllers/v2/user/login.ts:42 遗留 console.log
- ...

### 总体评价
✅ 通过 / ⚠️ 建议修复 / ❌ 必须修复
```

## 何时使用

- 提交前验证代码质量。
- 发起 Pull Request 前。
- 被问到"帮我审查代码"或"code review"时。
