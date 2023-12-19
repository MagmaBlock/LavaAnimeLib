/**
 * 测试一个邀请码是否可用
 * @param code
 * @returns
 */
export async function inviteCodeTest(code: string) {
  try {
    const find = await usePrisma.inviteCode.findFirst({
      where: {
        code: code,
        usedBy: null,
        OR: [
          {
            expiredAt: {
              gt: new Date(),
            },
          },
          {
            expiredAt: null,
          },
        ],
      },
    });
    if (find === null) return false;
    else return true;
  } catch (error) {
    throw error;
  }
}
