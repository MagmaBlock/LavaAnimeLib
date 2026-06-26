import config from "../env.js";

const BANGUMI_ORIG_IMAGE_HOST = "https://lain.bgm.tv";

function targetHost(): string {
  return config.bangumiImage.host.replace(/\/+$/, "");
}

/**
 * 将 Bangumi 原始图片地址（lain.bgm.tv）替换为环境变量 BANGUMI_IMAGE_HOST 指向的地址。
 * 仅影响接口返回给前端的值，数据库中持久化的始终是 BGM API 返回的原始 URL。
 */
export function rewriteBgmImageUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;
  const target = targetHost();
  if (target === BANGUMI_ORIG_IMAGE_HOST) return url;
  return url.replace(
    /^https:\/\/lain\.bgm\.tv/i,
    target
  );
}

/**
 * 根据环境变量 BANGUMI_IMAGE_APPEND_POSTER 决定是否在图片地址后追加 /poster 后缀。
 * 仅用于接口返回给前端的封面图地址，持久化的仍是原始 URL。
 */
export function appendPosterSuffix(
  largeUrl: string | null | undefined
): string | null {
  if (!largeUrl) return null;
  return config.bangumiImage.appendPoster ? `${largeUrl}/poster` : largeUrl;
}
