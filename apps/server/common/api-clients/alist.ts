import axios, { AxiosInstance } from "axios";

export function createAlistClient(baseURL: string): AxiosInstance {
  return axios.create({ baseURL });
}
