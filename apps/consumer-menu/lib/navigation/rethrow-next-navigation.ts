/** Server Action `redirect()` — 클라이언트 catch 에서 실패로 오인하지 않도록 */
export function isNextNavigationError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: string }).digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"))
  );
}

export function rethrowNextNavigation(error: unknown): void {
  if (isNextNavigationError(error)) throw error;
}
