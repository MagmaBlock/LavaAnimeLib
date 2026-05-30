import crypto from "node:crypto";
import axios, { type AxiosInstance } from "axios";
import type { FileSystemDriver, FileSystemEntry, ListOptions } from "./types.js";
import type { AlistDriveConfig } from "@lavaanime/shared";

interface AlistApiFile {
  name: string;
  size: number;
  modified: string;
  is_dir: boolean;
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
  private token: string;
  private signExpireHours: number;

  constructor(config: AlistDriveConfig) {
    this.client = axios.create({ baseURL: config.host });
    this.rootPath = ensureLeadingSlash(config.path);
    this.password = config.password ?? "";
    this.token = config.token ?? "";
    this.signExpireHours = config.signExpireHours ?? 0;
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
      };
    });
  }

  getDownloadUrl(entry: FileSystemEntry, endpointBaseUrl: string): string {
    if (!endpointBaseUrl) {
      return "";
    }
    const url = new URL(endpointBaseUrl);
    url.pathname = joinPaths("/d", this.rootPath, entry.path);
    const sign = this.generateSign(entry.path);
    if (sign) {
      url.searchParams.set("sign", sign);
    }
    return url.toString();
  }

  generateSign(normalizedPath: string): string {
    if (!this.token) {
      return "";
    }
    const physicalPath = joinPaths(this.rootPath, normalizedPath).replace(/\/+/g, "/");
    const expire = this.signExpireHours > 0
      ? Math.floor(Date.now() / 1000) + this.signExpireHours * 3600
      : 0;
    const data = `${physicalPath}:${expire}`;
    const hmac = crypto.createHmac("sha256", this.token).update(data).digest();
    const signature = Buffer.from(hmac)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    return `${signature}:${expire}`;
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
