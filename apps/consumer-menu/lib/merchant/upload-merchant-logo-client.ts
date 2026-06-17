/** 매장 로고 — 선택 즉시 Route Handler 업로드 (server action 6MB·모바일 FormData 이슈 회피) */

import {
  convertHeicLogoFileToJpeg,
  forceLogoJpegUnderBytes,
  isHeicLogoFile,
  prepareLogoUploadFile,
} from "@/lib/merchant/normalize-logo-upload-file";

/** Vercel 요청 본문 상한(≈4.5MB) 여유 */
const UPLOAD_BODY_BUDGET = 3_500_000;

async function buildUploadPayload(file: File): Promise<File> {
  if (file.size === 0) {
    throw new Error("빈 파일입니다. 다른 사진을 선택해 주세요.");
  }

  let working = file;
  if (await isHeicLogoFile(file)) {
    const jpeg = await convertHeicLogoFileToJpeg(file);
    if (jpeg) {
      working = jpeg;
    } else if (file.size > UPLOAD_BODY_BUDGET) {
      throw new Error(
        "HEIC 사진이 너무 커요. 갤러리에서 같은 사진을 다시 선택하거나 카메라 품질을 낮춰 주세요.",
      );
    }
    // heic2any 실패 — 원본 HEIC를 서버 heic-convert에 맡김 (용량 허용 시)
  }

  if (working.size <= UPLOAD_BODY_BUDGET) {
    return working;
  }

  try {
    const prepared = await prepareLogoUploadFile(working);
    if (prepared.size <= UPLOAD_BODY_BUDGET) return prepared;
  } catch {
    /* 대용량만 클라이언트 압축 */
  }

  try {
    return await forceLogoJpegUnderBytes(working, UPLOAD_BODY_BUDGET);
  } catch {
    throw new Error(
      "사진이 너무 커요. 카메라 품질을 낮추거나 조금 멀리서 다시 촬영해 주세요.",
    );
  }
}

export async function uploadMerchantLogoFile(
  tenant: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  let payload: File;
  try {
    payload = await buildUploadPayload(file);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "사진을 준비하지 못했습니다.";
    return { ok: false, message: msg };
  }

  const fd = new FormData();
  fd.set("file", payload, payload.name || "logo.jpg");

  const res = await fetch(`/m/${encodeURIComponent(tenant)}/more/store/logo-upload`, {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });

  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; url?: string; message?: string }
    | null;

  if (!res.ok || !json?.ok || !json.url) {
    return {
      ok: false,
      message: json?.message ?? "사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { ok: true, url: json.url };
}
