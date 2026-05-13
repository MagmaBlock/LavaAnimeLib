import type { RowDataPacket } from "mysql2";

export interface UserData {
  avatar?: string;
  permission?: {
    admin?: boolean;
    invite?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface UserSettings {
  [key: string]: unknown;
}

export interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  name: string;
  password: string;
  create_time: Date | string | null;
  data: string | UserData | null;
  settings: string | UserSettings | null;
}

export interface User extends Omit<UserRow, "data" | "settings"> {
  data: UserData | null;
  settings: UserSettings | null;
  expirationTime?: Date;
}

export interface AnimeRow extends RowDataPacket {
  id: number;
  year: string;
  type: string;
  name: string;
  views: number;
  bgmid: string | null;
  nsfw: number;
  title: string | null;
  deleted: number;
  poster: string | null;
}

export interface TokenRow extends RowDataPacket {
  token: string;
  user: number;
  create_time: Date | string;
  expiration_time: Date | string;
  status: number;
}

export interface SettingsRow extends RowDataPacket {
  key: string;
  value: string | null;
}

export interface InviteCodeRow extends RowDataPacket {
  code: string;
  code_user: number | null;
  code_creator: number | null;
  create_time: Date | string | null;
  use_time: Date | string | null;
  expiration_time: Date | string | null;
}

export interface BangumiDataRow extends RowDataPacket {
  bgmid: number;
  relations_anime: string | null;
  subjects: string | null;
  characters: string | null;
  update_time: Date | string | null;
}

export interface FollowRow extends RowDataPacket {
  user_id: number;
  anime_id: number;
  status: number;
  edit_time: Date | string | null;
}

export interface ViewHistoryRow extends RowDataPacket {
  id: number;
  userID: number;
  animeID: number;
  fileName: string | null;
  episode: string | null;
  currentTime: number | null;
  totalTime: number | null;
  userIP: string | null;
  watchMethod: string | null;
  lastReportTime: Date | string | null;
  useDrive: string | null;
}

export interface UploadMessageRow extends RowDataPacket {
  id: number;
  index: string;
  animeID: number | null;
  bangumiID: number | null;
  fileName: string | null;
  messageSentStatus: number;
  uploadTime: Date | string | null;
  messageSkiped: number;
}
