/** VAPID for Web Push; private key never exposed to the client. */

let configured = false;

export function isMerchantWebPushConfigured(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const subj = process.env.VAPID_SUBJECT?.trim();
  return Boolean(pub && priv && subj);
}

export function getMerchantVapidPublicKeyForClient(): string | null {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return pub || null;
}

/** Call before send; no-op if already configured in this process. */
export async function ensureWebPushVapidConfigured(): Promise<boolean> {
  if (configured) return true;
  if (!isMerchantWebPushConfigured()) return false;

  const webpush = (await import("web-push")).default;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY!.trim();
  const subject = process.env.VAPID_SUBJECT!.trim();

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}
