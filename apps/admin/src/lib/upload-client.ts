import { useAuthStore } from "../store/useAuthStore";

import { API_URL, isTokenExpiringOrExpired, refreshAccessToken } from "./api-client";

export interface UploadProgressInfo {
  loaded: number;
  total: number;
  percentage: number;
  speedBytesPerSec: number;
  status: "pending" | "uploading" | "processing" | "success" | "error" | "cancelled";
  errorMessage?: string;
  response?: any;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function uploadFileWithXHR(
  file: File,
  onProgress: (progress: UploadProgressInfo) => void,
  signal?: AbortSignal
): Promise<any> {
  // Proactive preemptive token refresh before initiating upload if token is expiring in < 60 seconds
  let token = useAuthStore.getState().token;
  if (token && isTokenExpiringOrExpired(token, 60)) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      token = refreshedToken;
    }
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 60_000; // 60 seconds timeout for uploads
    const formData = new FormData();
    formData.append("file", file);

    const startTime = Date.now();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const speed = elapsedTime > 0 ? Math.round(event.loaded / elapsedTime) : 0;
        const percentage = Math.min(99, Math.round((event.loaded / event.total) * 100));

        if (event.loaded >= event.total) {
          onProgress({
            loaded: event.total,
            total: event.total,
            percentage: 100,
            speedBytesPerSec: speed,
            status: "processing",
          });
        } else {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage,
            speedBytesPerSec: speed,
            status: "uploading",
          });
        }
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 401) {
        // Handle reactive 401 token refresh & upload retry
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          try {
            const retryRes = await uploadFileWithXHR(file, onProgress, signal);
            return resolve(retryRes);
          } catch (retryErr) {
            return reject(retryErr);
          }
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          onProgress({
            loaded: file.size,
            total: file.size,
            percentage: 100,
            speedBytesPerSec: 0,
            status: "success",
            response: res,
          });
          resolve(res);
        } catch {
          const err = new Error("Invalid server response format");
          onProgress({
            loaded: 0,
            total: file.size,
            percentage: 0,
            speedBytesPerSec: 0,
            status: "error",
            errorMessage: err.message,
          });
          reject(err);
        }
      } else {
        let errorMsg = `Upload failed (HTTP ${xhr.status})`;
        try {
          const res = JSON.parse(xhr.responseText);
          if (res?.error?.message) errorMsg = res.error.message;
        } catch {
          // Ignore non-JSON response parsing errors
        }

        const err = new Error(errorMsg);
        onProgress({
          loaded: 0,
          total: file.size,
          percentage: 0,
          speedBytesPerSec: 0,
          status: "error",
          errorMessage: errorMsg,
        });
        reject(err);
      }
    };

    xhr.onerror = () => {
      const err = new Error("Network error during file upload");
      onProgress({
        loaded: 0,
        total: file.size,
        percentage: 0,
        speedBytesPerSec: 0,
        status: "error",
        errorMessage: err.message,
      });
      reject(err);
    };

    xhr.ontimeout = () => {
      const err = new Error("File upload timed out");
      onProgress({
        loaded: 0,
        total: file.size,
        percentage: 0,
        speedBytesPerSec: 0,
        status: "error",
        errorMessage: err.message,
      });
      reject(err);
    };

    xhr.onabort = () => {
      const err = new Error("Upload cancelled by user");
      onProgress({
        loaded: 0,
        total: file.size,
        percentage: 0,
        speedBytesPerSec: 0,
        status: "cancelled",
        errorMessage: "Cancelled by user",
      });
      reject(err);
    };

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.open("POST", `${API_URL}/admin/media/upload`);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}
