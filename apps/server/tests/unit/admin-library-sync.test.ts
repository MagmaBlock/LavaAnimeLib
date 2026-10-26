import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";

vi.mock("../../common/tools/logger.js", () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { adminAnimeLibrarySync } from "../../controllers/v2/admin/anime/library-sync.js";

function createResponse() {
  const res = {
    status: vi.fn(),
    send: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  };
}

describe("adminAnimeLibrarySync", () => {
  it("markMissing=true 应返回 400", async () => {
    const req = { body: { markMissing: true } } as unknown as Request;
    const res = createResponse();

    await adminAnimeLibrarySync(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 400,
        message: expect.stringContaining("缺失标记暂未开放"),
      }),
    );
  });
});
