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

export interface UserRow {
  id: number;
  email: string;
  name: string;
  password: string;
  create_time: Date | null;
  data: string | null;
  settings: string | null;
}

export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  create_time: Date | string | null;
  data: UserData | null;
  settings: UserSettings | null;
  expirationTime?: Date;
}
