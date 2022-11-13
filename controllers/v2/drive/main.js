import config from "../../../common/config.js";

export function getDriveList() {
  return {
    default: config.drive.default,
    list: config.drive.list.map(drive => {
      return {
        id: drive.id, name: drive.name
      }
    })
  }
}

export function getDrivePath(drive) {
  let driveID = drive ? drive : config.drive.default
  let drivePath
  config.drive.list.forEach(drive => {
    if (drive.id == driveID) drivePath = drive.path
  })
  return drivePath
}