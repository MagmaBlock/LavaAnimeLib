import config from "../../../common/config.js";

/**
 * (向前端回复时) 返回可用的视频节点
 * @returns {Object}
 */
export function getDriveList() {
  return {
    default: config.drive.default,
    list: config.drive.list.map((drive) => {
      return {
        id: drive.id,
        name: drive.name,
        description: drive.description,
        banNSFW: drive.banNSFW,
      };
    }),
  };
}

/**
 * 根据 Drive ID，获取指定 Drive
 * @param {String} drive
 * @returns {Object | undefined}
 */
export function getDrive(drive) {
  if (!drive) throw "获取 Drive 时未提供 Drive ID";

  // Array.find() 传入一个 function, function 的 return 首次为真时，将会返回 Array 中对应的 element.
  return config.drive.list.find((forDrive) => forDrive.id == drive);
}

/**
 * 获取默认 Drive. 如果未配置默认 Drive, 将是第一个 Drive.
 * @returns {String}
 */
export function getDefaultDrive() {
  return config.drive.default ?? config.drive.list[0].id;
}
