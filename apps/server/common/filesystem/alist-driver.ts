import axios, { type AxiosInstance } from "axios";
import type { FileSystemDriver, FileSystemEntry, ListOptions } from "./types.js";

interface AlistConfig {
  host: string;
  path: string;
  password?: string;
}

interface AlistApiFile {
  name: string;
  size: number;
  modified: string;
  is_dir: boolean;
  sign?: string;
}

interface AlistApiResponse {
  code: number;
  message: string;
  data: {
    content: AlistApiFile[] | null;
  };
}

export class AlistDriver implements FileSystemDriver {
  readonly type = "alist";

  private client: AxiosInstance;
  private rootPath: string;
  private password: string;

  constructor(config: AlistConfig) {
    this.client = axios.create({ baseURL: config.host });
    this.rootPath = ensureLeadingSlash(config.path);
    this.password = config.password ?? "";
  }

  async list(normalizedPath: string, options?: ListOptions): Promise<FileSystemEntry[]> {
    const physicalPath = joinPaths(this.rootPath, normalizedPath).replace(/\/+/g, "/");

    const result = await this.client.post<AlistApiResponse>("/api/fs/list", {
      path: physicalPath,
      password: this.password,
      page: options?.page ?? 1,
      per_page: options?.pageSize ?? 0,
    });

    if (result.data.code !== 200) {
      if (result.data.code === 500 && result.data.message.includes("not found")) {
        return [];
      }
      throw new Error(`AList API 错误: ${result.data.message}`);
    }

    return (result.data.data.content ?? []).map((file) => {
      const physicalEntryPath = joinPaths(physicalPath, file.name).replace(/\/+/g, "/");
      const normalizedEntryPath = stripPrefix(physicalEntryPath, this.rootPath) || "/";
      return {
        name: file.name,
        path: normalizedEntryPath,
        type: file.is_dir ? "dir" : "file",
        size: file.size,
        modified: file.modified,
        sign: file.sign,
      };
    });
  }

  getDownloadUrl(entry: FileSystemEntry, endpointBaseUrl: string): string {
    const url = new URL(endpointBaseUrl);
    url.pathname = joinPaths("/d", this.rootPath, entry.path);
    if (entry.sign) {
      url.searchParams.set("sign", entry.sign);
    }
    return url.toString();
  }
}

function ensureLeadingSlash(p: string): string {
  return p.startsWith("/") ? p : `/${p}`;
}

function joinPaths(...segments: string[]): string {
  const cleaned = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter((s) => s.length > 0);
  const hasLeadingSlash = segments.some((s) => s.startsWith("/"));
  return (hasLeadingSlash ? "/" : "") + cleaned.join("/");
}

function stripPrefix(fullPath: string, prefix: string): string {
  const normalizedPrefix = prefix.replace(/\/+$/, "");
  if (fullPath === normalizedPrefix) return "/";
  if (fullPath.startsWith(normalizedPrefix + "/")) {
    return fullPath.slice(normalizedPrefix.length);
  }
  return fullPath;
}
