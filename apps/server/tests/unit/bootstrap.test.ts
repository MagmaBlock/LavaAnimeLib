import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockExecute = vi.fn();

vi.mock("../../common/database/connection.js", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}));

vi.mock("../../common/tools/logger.js", () => ({
  log: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../services/v2/user/password.js", () => ({
  getFormattedPassword: vi.fn((pw: string) => `hashed_${pw}`),
}));

import { bootstrapFirstAdmin } from "../../tasks/v2/bootstrap.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ from: mockFrom });
});

describe("bootstrapFirstAdmin", () => {
  it("用户表为空时应创建管理员并返回 bootstrapped: true", async () => {
    mockFrom.mockResolvedValue([{ c: 0 }]);
    mockExecute.mockResolvedValue(undefined);

    const result = await bootstrapFirstAdmin();

    expect(result).toEqual({
      bootstrapped: true,
      email: "admin@lavaanime.local",
      name: "admin",
    });
    expect(mockExecute).toHaveBeenCalledOnce();
  });

  it("用户表不为空时应跳过创建并返回 bootstrapped: false", async () => {
    mockFrom.mockResolvedValue([{ c: 5 }]);

    const result = await bootstrapFirstAdmin();

    expect(result).toEqual({
      bootstrapped: false,
      email: "",
      name: "",
    });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("用户表返回 null/undefined count 时应视为 0 并创建管理员", async () => {
    mockFrom.mockResolvedValue([{}]);
    mockExecute.mockResolvedValue(undefined);

    const result = await bootstrapFirstAdmin();

    expect(result).toEqual({
      bootstrapped: true,
      email: "admin@lavaanime.local",
      name: "admin",
    });
    expect(mockExecute).toHaveBeenCalledOnce();
  });
});
