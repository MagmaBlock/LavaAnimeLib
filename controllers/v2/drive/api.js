import success from '../response/2xx/success.js';
import { getDriveList } from './main.js';

export async function getDriveListAPI(req, res) {
  const latestDriveList = getDriveList()
  success(res, latestDriveList)
}