// storage.ts : 保存アダプタ。拡張では chrome.storage.local。将来のPWAは localStorage 等に差し替えるだけ。
// 画面/ロジックは必ずこの store 経由で保存し、chrome.storage を直接散在させない。
export interface Store {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

const fallbackStore = new Map<string, unknown>();

export const store: Store = {
  get<T>(key: string) {
    return new Promise<T | null>((resolve) => {
      chrome.storage.local.get(key, (values) => {
        if (fallbackStore.has(key)) {
          resolve((fallbackStore.get(key) as T | null | undefined) ?? null);
          return;
        }

        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }

        resolve((values[key] as T | undefined) ?? null);
      });
    });
  },
  set<T>(key: string, value: T) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          fallbackStore.set(key, value);
          resolve();
          return;
        }

        fallbackStore.delete(key);
        resolve();
      });
    });
  },
  remove(key: string) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          fallbackStore.set(key, null);
          resolve();
          return;
        }

        fallbackStore.delete(key);
        resolve();
      });
    });
  },
};
