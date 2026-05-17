import config from "../../../common/config.js";

export interface DriveInfo {
  id: string;
  name: string;
  description: string;
  banNSFW: boolean;
}

export interface DriveListResult {
  default: string;
  list: DriveInfo[];
}

export function getDriveList(): DriveListResult {
  return {
    default: config.drive.default,
    list: config.drive.list.map((drive) => ({
      id: drive.id,
      name: drive.name,
      description: drive.description,
      banNSFW: drive.banNSFW,
    })),
  };
}

export function getDrive(drive: string): typeof config.drive.list[number] | undefined {
  if (!drive) throw new Error("获取 Drive 时未提供 Drive ID");
  return config.drive.list.find((forDrive) => forDrive.id === drive);
}

export function getDefaultDrive(): string {
  return config.drive.default ?? config.drive.list[0].id;
}
