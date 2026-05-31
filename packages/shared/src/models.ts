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

export interface EndpointInfo {
  id: number;
  name: string;
  priority: number;
  banNSFW: boolean;
  disableDownload: boolean;
}

export interface DriveInfo {
  id: string;
  name: string;
  description: string;
  banNSFW: boolean;
  endpoints: EndpointInfo[];
}

export interface AlistDriveConfig {
  host: string;
  path: string;
  password: string;
  token?: string;
  signExpireHours?: number;
}

export type DriveConfig = AlistDriveConfig;

export type DriveConfigOverride = Partial<AlistDriveConfig>;

export interface DriveRecord {
  id: string;
  name: string;
  description: string;
  type: string;
  config: DriveConfig;
  banNSFW: boolean;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
}

export interface DriveListResult {
  default: string;
  list: DriveInfo[];
}

export interface EndpointRecord {
  id: number;
  driveId: string;
  name: string;
  configOverride: DriveConfigOverride | null;
  priority: number;
  enabled: boolean;
  banNSFW: boolean;
  disableDownload: boolean;
}

export interface FileIndexItem {
  id: number;
  driveId: string;
  animeId: number | null;
  path: string;
  name: string;
  size: number;
  type: string;
  deleted: number;
  modified: string | null;
  sign: string | null;
  indexedAt: string;
}

export interface FileIndexStats {
  totalFiles: number;
  totalDirs: number;
  deletedFiles: number;
  lastIndexedAt: string | null;
}

export interface FileIndexListData {
  items: FileIndexItem[];
  total: number;
}

export interface FileDriveSource {
  driveId: string;
  driveName: string;
  path: string;
}

export interface AggregatedFileItem {
  name: string;
  size: number;
  type: string;
  modified: string | null;
  drives: FileDriveSource[];
}
