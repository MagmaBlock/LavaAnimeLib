import { describe, it, expect } from "vitest";
import { reportUploadMessage } from "../../services/v2/report/upload-message.js";
import { db } from "../../common/database/connection.js";
import { uploadMessage } from "../../common/database/schema/upload-message.js";
import { eq, and } from "drizzle-orm";

describe("reportUploadMessage", () => {
  it("上报已关联 BangumiData 的番剧应成功", async () => {
    const result = await reportUploadMessage(
      "2026年/1月冬/测试番剧A 123456",
      "ep01_test.mkv"
    );
    expect(result).toBe(true);
  });

  it("上报未入库的番剧应成功（animeID=null）", async () => {
    const result = await reportUploadMessage(
      "2026年/1月冬/全新番剧 999999",
      "new_ep.mkv"
    );
    expect(result).toBe(true);
  });

  it("上报后可在 upload_message 表中查到", async () => {
    const index = "2026年/1月冬/测试番剧B 234567";
    await reportUploadMessage(index, "ep02_test.mkv");
    const rows = await db
      .select()
      .from(uploadMessage)
      .where(
        and(
          eq(uploadMessage.index, index),
          eq(uploadMessage.fileName, "ep02_test.mkv")
        )
      );
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});
