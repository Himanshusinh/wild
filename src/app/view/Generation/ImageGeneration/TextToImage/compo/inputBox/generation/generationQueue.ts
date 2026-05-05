/** Best-effort message extraction from provider queue / status payloads */
export function extractQueueFailureMessage(
  status: any,
  fallbackMessage: string,
): string {
  const candidates = [
    status?.message,
    status?.error,
    status?.failure,
    status?.detail,
    status?.data?.message,
    status?.data?.error,
    status?.data?.detail,
    status?.response?.message,
    status?.response?.error,
    status?.response?.detail,
  ];
  const resolved = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  ) as string | undefined;
  return resolved || fallbackMessage;
}
