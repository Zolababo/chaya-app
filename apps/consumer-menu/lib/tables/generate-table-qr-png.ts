import "server-only";

import QRCode from "qrcode";

const QR_SIZE = 512;

/** CHAYA 서버에서 생성하는 테이블 QR PNG (외부 API 없음). */
export async function generateTableQrPng(data: string): Promise<Buffer> {
  const text = data.trim();
  if (!text) throw new Error("empty_qr_payload");
  return QRCode.toBuffer(text, {
    type: "png",
    width: QR_SIZE,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
