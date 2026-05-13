import _ from "lodash";

type CacheValue = Record<string, any>;
type CacheTable = Record<string, any> | any[];

/*
  全局的缓存存储. 结构如下
  其中 key 若为对象，则会尝试读取 expirationTime，如果有，将会自动进行过期清理
  {
    tableName: {
      key: {
        ...,
        expirationTime: Date
      }
    },
    tableArrayName: [
      {
        ...,
        expirationTime: Date
      }
    ]
  }
*/
let cache: Record<string, CacheTable> & {
  token: Record<string, { user: number; expirationTime: Date }>;
  user: Record<string, any>;
  hot: any[];
} = {
  token: {
    /*
    'token': {
      user: ...,
      expirationTime: ...
    } 
    */
  },
  user: {
    /*
    userID: {
      ... user 数据
    }
    */
  },
  hot: [], // 热门动画获取
};

// GC
setInterval(() => {
  let now = new Date();
  Object.keys(cache).forEach((table) => {
    // 遍历每个表
    Object.keys(cache[table]).forEach((key) => {
      // 遍历每个子对象
      if (_.isObject(cache[table][key]) && !_.isArray(cache[table][key])) {
        // 如果是真对象
        if (new Date((cache[table][key] as any).expirationTime) <= now) {
          // 判断过期
          delete cache[table][key];
        }
      }
    });
  });
}, 20 * 1000);

export default cache;
