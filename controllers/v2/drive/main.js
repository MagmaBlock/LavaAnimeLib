import config from "../../../common/config.js";

export function getDriveList() {
  return {
    default: config.drive.default,
    list: config.drive.list.map((drive) => {
      return {
        id: drive.id,
        name: drive.name,
      };
    }),
  };
}

// 获取指定的 Drive 的路径，如 /2AG_CF/LavaAnimeLib
export function getDrivePath(drive) {
  let driveID = drive ? drive : config.drive.default;
  let drivePath;
  config.drive.list.forEach((drive) => {
    if (drive.id == driveID) drivePath = drive.path;
  });
  return drivePath;
}

/**
 * 获取指定的 Drive 的 host，如 https://share.xxx.com
 */
export function getDriveHost(drive) {
  let driveID = drive ? drive : config.drive.default;
  let driveHost;
  config.drive.list.forEach((drive) => {
    if (drive.id == driveID) driveHost = drive.host;
  });
  return driveHost;
}
