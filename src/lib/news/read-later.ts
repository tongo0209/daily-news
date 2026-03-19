export const READ_LATER_KEY = "tin_viet_doc_sau_v1";
export const PREFERENCE_CATEGORIES_KEY = "tin_viet_pref_categories_v1";
export const STORAGE_SYNC_EVENT = "tin_viet_storage_sync";

export type ReadLaterItem = {
  slug: string;
  title: string;
  summary: string;
  sourceName: string;
  publishedAt: string;
  category: string;
  imageUrl: string | null;
  savedAt: string;
};

type StorageSyncDetail = {
  key: string;
};

export function parseReadLater(raw: string | null): ReadLaterItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is ReadLaterItem => {
      return (
        item !== null &&
        typeof item === "object" &&
        typeof (item as ReadLaterItem).slug === "string" &&
        typeof (item as ReadLaterItem).title === "string"
      );
    });
  } catch {
    return [];
  }
}

export function stringifyReadLater(items: ReadLaterItem[]): string {
  return JSON.stringify(items);
}

export function parsePreferenceCategories(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function subscribeStorageKey(key: string, onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === key) {
      onStoreChange();
    }
  };

  const onLocalUpdate = (event: Event) => {
    const detail = (event as CustomEvent<StorageSyncDetail>).detail;

    if (detail?.key === key) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(STORAGE_SYNC_EVENT, onLocalUpdate as EventListener);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STORAGE_SYNC_EVENT, onLocalUpdate as EventListener);
  };
}

function notifyStorageUpdate(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<StorageSyncDetail>(STORAGE_SYNC_EVENT, {
      detail: { key },
    }),
  );
}

export function getStorageSnapshot(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) ?? "";
}

export function readReadLaterItems(): ReadLaterItem[] {
  return parseReadLater(getStorageSnapshot(READ_LATER_KEY));
}

export function writeReadLaterItems(items: ReadLaterItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(READ_LATER_KEY, stringifyReadLater(items));
  notifyStorageUpdate(READ_LATER_KEY);
}

export function readPreferredCategories(): string[] | null {
  const raw = getStorageSnapshot(PREFERENCE_CATEGORIES_KEY);

  if (!raw) {
    return null;
  }

  return parsePreferenceCategories(raw);
}

export function writePreferredCategories(values: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PREFERENCE_CATEGORIES_KEY, JSON.stringify(values));
  notifyStorageUpdate(PREFERENCE_CATEGORIES_KEY);
}
