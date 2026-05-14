import axios from "axios";

export function createAlistClient(baseURL: string) {
  return axios.create({ baseURL });
}
