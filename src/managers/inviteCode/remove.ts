/**
 * 删除邀请码
 * @param code
 * @param createdById 筛选创建者
 * @param expiredLt 筛选过期时间早于...
 */
export async function inviteCodeRemove(
  code?: string,
  createdById?: number,
  expiredLt?: Date
) {
  try {
    return await usePrisma.inviteCode.deleteMany({
      where: {
        code: code ?? undefined,
        createdById: createdById ?? undefined,
        expiredAt:
          expiredLt instanceof Date
            ? {
                lt: expiredLt,
              }
            : undefined,
      },
    });
  } catch (error) {
    throw error;
  }
}
