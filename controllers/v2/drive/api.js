import { getDriveList } from './main.js';

export async function getDriveListAPI(req, res) {
  const latestDriveList = getDriveList()
  res.send({
    code: 200, message: '', data: latestDriveList
  })
}