import axiosInstance from "@/lib/axiosInstance";

export const updateFirebaseHistory = async (
  id: string | undefined,
  updates: any,
) => {
  if (!id) return;
  try {
    await axiosInstance.patch(
      `/api/generations/${encodeURIComponent(id)}`,
      updates,
    );
  } catch {
    // best-effort; UI will refresh from backend anyway
  }
};

/** Backend no longer exposes POST /api/generations from the web app; providers create history records themselves. */
export const saveHistoryEntry = async (
  _entry: any,
): Promise<string | undefined> => undefined;
