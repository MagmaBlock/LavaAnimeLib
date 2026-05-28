export interface FileSystemEntry {
  name: string;
  /** 归一化路径，由 Driver 剥离连接配置 rootPath 前缀后返回 */
  path: string;
  type: "file" | "dir";
  size: number;
  modified: string;
  sign?: string;
}

export interface ListOptions {
  page?: number;
  pageSize?: number;
}

export interface FileSystemDriver {
  readonly type: string;
  list(path: string, options?: ListOptions): Promise<FileSystemEntry[]>;
  getDownloadUrl(entry: FileSystemEntry, endpointBaseUrl: string): string;
}
