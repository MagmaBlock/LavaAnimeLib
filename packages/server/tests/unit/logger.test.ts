import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("log", () => {
  let log: typeof import("../../common/tools/logger.js").log;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../common/tools/logger.js");
    log = mod.log;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("应该导出 log 对象", () => {
    expect(log).toBeDefined();
    expect(typeof log).toBe("object");
  });

  it("应该具备 info 方法且可调用不抛出异常", () => {
    expect(typeof log.info).toBe("function");
    expect(() => log.info("test info message")).not.toThrow();
  });

  it("应该具备 error 方法且可调用不抛出异常", () => {
    expect(typeof log.error).toBe("function");
    expect(() => log.error("test error message")).not.toThrow();
  });

  it("应该具备 warn 方法且可调用不抛出异常", () => {
    expect(typeof log.warn).toBe("function");
    expect(() => log.warn("test warn message")).not.toThrow();
  });

  it("info 方法应支持格式化字符串", () => {
    expect(() => log.info("value=%d word=%s", 42, "hello")).not.toThrow();
  });

  it("error 方法应支持 Error 对象 + 消息", () => {
    expect(() => log.error(new Error("boom"), "something failed")).not.toThrow();
  });

  it("日志对象应为单例", async () => {
    const mod2 = await import("../../common/tools/logger.js");
    expect(mod2.log).toBe(log);
  });
});
