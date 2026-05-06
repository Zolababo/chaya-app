/** PostgREST/DB 오류 문자열 패턴 등 — Supabase JS가 넘기는 형태만 가정합니다. */
type LooseDbError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null;

function normalizeMsg(e: LooseDbError): string {
  if (!e) return "";
  return [e.message, e.details, e.hint].filter(Boolean).join(" ").toLowerCase();
}

function isTransportOrCloudTransient(e: LooseDbError): boolean {
  const msg = normalizeMsg(e);
  if (
    /fetch failed|network request failed|failed to fetch|load failed|econnreset|etimedout|socket hang up|networkerror|aborted|timeout/.test(
      msg,
    )
  ) {
    return true;
  }
  if (/\b(502|503|504)\b/.test(msg)) return true;
  if (/service unavailable|bad gateway|gateway timeout/.test(msg)) return true;
  return false;
}

/** 읽기(RPC/SELECT): 일시적 장애·게이트웨이 오류일 때만 재시도합니다. */
export function isRetryableSupabaseReadError(error: LooseDbError): boolean {
  if (!error) return false;
  if (isTransportOrCloudTransient(error)) return true;
  const code = String(error.code ?? "");
  if (code.startsWith("08")) return true;
  if (code === "57014" || code === "53300") return true;
  return false;
}

/**
 * 쓰기(INSERT 등): 이중 삽입을 피하려고 **운송·연결 계열**만 재시도합니다.
 * (애매한 5xx·제약 위반·RLS 오류는 재시도하지 않습니다.)
 */
export function isRetryableSupabaseWriteError(error: LooseDbError): boolean {
  if (!error) return false;
  if (isTransportOrCloudTransient(error)) return true;
  const code = String(error.code ?? "");
  if (code.startsWith("08")) return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type SupabaseOpResult<T> = { data: T; error: LooseDbError };

export async function withSupabaseReadRetry<T>(
  run: () => PromiseLike<SupabaseOpResult<T>>,
  options?: { maxAttempts?: number },
): Promise<SupabaseOpResult<T>> {
  const maxAttempts = Math.min(5, Math.max(1, options?.maxAttempts ?? 3));
  const delays = [280, 650];
  let last = await Promise.resolve(run());
  for (let i = 1; i < maxAttempts && last.error && isRetryableSupabaseReadError(last.error); i += 1) {
    await sleep(delays[i - 1] ?? 500);
    last = await Promise.resolve(run());
  }
  return last;
}

export async function withSupabaseWriteRetry<T>(
  run: () => PromiseLike<SupabaseOpResult<T>>,
  options?: { maxAttempts?: number },
): Promise<SupabaseOpResult<T>> {
  const maxAttempts = Math.min(4, Math.max(1, options?.maxAttempts ?? 3));
  const delays = [350, 800];
  let last = await Promise.resolve(run());
  for (let i = 1; i < maxAttempts && last.error && isRetryableSupabaseWriteError(last.error); i += 1) {
    await sleep(delays[i - 1] ?? 600);
    last = await Promise.resolve(run());
  }
  return last;
}
