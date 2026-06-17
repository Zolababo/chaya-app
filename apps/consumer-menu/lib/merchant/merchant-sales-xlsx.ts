import "server-only";

import JSZip from "jszip";

import type { MerchantSalesExportRow } from "@/lib/merchant/merchant-sales-csv";

const STATUS_KO: Record<string, string> = {
  pending: "대기",
  accepted: "접수",
  cooking: "조리중",
  ready: "준비완료",
  served: "서빙완료",
  completed: "완료",
  cancelled: "취소",
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatKst(iso: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function statusLabel(status: string): string {
  return STATUS_KO[status] ?? status;
}

function rowXml(cells: (string | number)[]): string {
  const inner = cells
    .map((c) => {
      if (typeof c === "number") {
        return `<c><v>${c}</v></c>`;
      }
      return `<c t="inlineStr"><is><t>${xmlEscape(String(c))}</t></is></c>`;
    })
    .join("");
  return `<row>${inner}</row>`;
}

/** 최근 주문 — Excel(.xlsx) Open XML (jszip, 추가 패키지 없음) */
export async function buildMerchantSalesXlsxBuffer(rows: MerchantSalesExportRow[]): Promise<Buffer> {
  const header = ["주문시각(KST)", "주문번호", "상태", "테이블", "합계(원)", "품목수"];
  const dataRows = rows.map((r) => [
    formatKst(r.createdAt),
    r.orderNo ?? "",
    statusLabel(r.status),
    r.tableNo ?? "",
    r.totalPrice,
    r.itemCount,
  ]);

  const sheetRows = [rowXml(header), ...dataRows.map((r) => rowXml(r))].join("");
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="매출" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.worksheet+xml"/>
</Types>`,
  );
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  );
  const xl = zip.folder("xl");
  xl?.file("workbook.xml", workbookXml);
  xl?.folder("_rels")?.file(
    "workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
  );
  xl?.folder("worksheets")?.file("sheet1.xml", sheetXml);

  const blob = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return blob;
}
