export interface AnimeItem {
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

export interface UserInfo {
  id: number;
  email: string;
  name: string;
  create_time: string | null;
  data: UserData | null;
  settings: UserSettings | null;
}

export interface UserRow {
  id: number;
  email: string;
  name: string;
  password: string;
  create_time: Date | null;
  data: string | null;
  settings: string | null;
}

export interface BangumiData {
  bgmid: number;
  relations_anime: string | null;
  subjects: string | null;
  characters: string | null;
  update_time: string | null;
}

export interface FollowItem {
  user_id: number;
  anime_id: number;
  status: number;
  edit_time: string | null;
}

export interface ViewHistoryItem {
  id: number;
  userID: number;
  animeID: number;
  fileName: string | null;
  episode: string | null;
  currentTime: number | null;
  totalTime: number | null;
  userIP: string | null;
  watchMethod: string | null;
  lastReportTime: string | null;
  useDrive: string | null;
}
