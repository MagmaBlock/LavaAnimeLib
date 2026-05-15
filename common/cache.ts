interface CacheTokenValue {
  user: number;
  expirationTime: Date;
}

interface CacheTableItem {
  expirationTime?: Date;
  [key: string]: unknown;
}

type CacheValue = Record<string, unknown>;
type CacheTable = Record<string, CacheTableItem> | CacheValue[];
type TokenCache = Record<string, CacheTokenValue>;
type UserCache = Record<string, CacheTableItem>;
type HotCache = CacheValue[];

type CacheStore = {
  token: TokenCache;
  user: UserCache;
  hot: HotCache;
} & Record<string, CacheTable>;

const cache: CacheStore = {
  token: {},
  user: {},
  hot: [],
};

setInterval(() => {
  const now = new Date();
  Object.keys(cache).forEach((table) => {
    const tableData = cache[table];
    if (Array.isArray(tableData)) return;
    Object.keys(tableData).forEach((key) => {
      const entry = tableData[key];
      if (entry && typeof entry === "object" && "expirationTime" in entry) {
        const expirationTime = (entry as CacheTableItem).expirationTime;
        if (expirationTime && new Date(expirationTime) <= now) {
          delete tableData[key];
        }
      }
    });
  });
}, 20 * 1000);

export default cache;
export type { CacheStore, CacheTableItem, CacheTokenValue };
