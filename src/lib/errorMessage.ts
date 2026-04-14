/**
 * Normalize errors from Redux unwrap(), axios, or thrown Error for display.
 * RTK rejectWithValue(string) throws the string directly — not an Error with .message.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const any = error as {
      message?: string;
      response?: { data?: { message?: string; error?: string } };
    };
    const fromAxios = any.response?.data?.message ?? any.response?.data?.error;
    if (typeof fromAxios === "string" && fromAxios.trim()) {
      return fromAxios;
    }
    if (typeof any.message === "string" && any.message.trim()) {
      return any.message;
    }
  }
  return fallback;
}
