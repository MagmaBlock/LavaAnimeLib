import type { useMessage } from "naive-ui";

declare global {
  interface Window {
    $message: ReturnType<typeof useMessage>;
  }
}

export {};
