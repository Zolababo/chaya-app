import { NextResponse, type NextRequest } from "next/server";

import JSZip from "jszip";



import { assertMerchantTableRoute } from "@/lib/tables/assert-merchant-table-route";

import { buildSignedConsumerTableUrl } from "@/lib/tables/build-signed-consumer-table-url";

import { generateTableQrPng } from "@/lib/tables/generate-table-qr-png";

import { listTenantTablesForMerchant } from "@/lib/tables/list-tenant-tables";



export const dynamic = "force-dynamic";

export const maxDuration = 60;



const ZIP_MAX_TABLES = 200;



type Ctx = { params: Promise<{ tenant: string }> };



function filterByCodes<T extends { table_code: string; is_active: boolean }>(

  items: T[],

  codesParam: string | null,

): T[] {

  const active = items.filter((t) => t.is_active);

  const raw = codesParam?.trim();

  if (!raw) return active;

  const wanted = new Set(

    raw

      .split(",")

      .map((c) => c.trim())

      .filter(Boolean),

  );

  return active.filter((t) => wanted.has(t.table_code));

}



export async function GET(request: NextRequest, ctx: Ctx) {

  const { tenant } = await ctx.params;

  const nextPath = `/m/${encodeURIComponent(tenant)}/tables`;

  const auth = await assertMerchantTableRoute(request, tenant, nextPath);

  if (!auth.ok) return auth.response;



  const list = await listTenantTablesForMerchant(tenant);

  if (!list.ok) {

    return NextResponse.json({ error: list.message }, { status: 500 });

  }



  const codesParam = request.nextUrl.searchParams.get("codes");

  const active = filterByCodes(list.items, codesParam);

  if (active.length === 0) {

    return NextResponse.json({ error: "no_tables" }, { status: 400 });

  }

  if (active.length > ZIP_MAX_TABLES) {

    return NextResponse.json({ error: "too_many_tables" }, { status: 400 });

  }



  const zip = new JSZip();

  const readme = [

    `CHAYA 테이블 QR — ${tenant}`,

    `생성: ${new Date().toISOString()}`,

    `테이블 ${active.length}개`,

    "",

    "파일명 table-XX.png 를 인쇄해 테이블·아크릴판에 붙이세요.",

    "같은 폴더의 urls.txt 에 손님 링크가 있습니다.",

    "",

  ].join("\n");

  zip.file("README.txt", readme);



  const urlLines: string[] = [];

  for (const row of active) {

    const url = buildSignedConsumerTableUrl(tenant, row.table_code);

    urlLines.push(`${row.table_code}\t${url}${row.label ? `\t${row.label}` : ""}`);

    const png = await generateTableQrPng(url);

    zip.file(`table-${row.table_code}.png`, png);

  }

  zip.file("urls.txt", urlLines.join("\n"));



  const blob = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const filename = `chaya-tables-${encodeURIComponent(tenant)}.zip`;



  return new NextResponse(new Uint8Array(blob), {

    headers: {

      "Content-Type": "application/zip",

      "Content-Disposition": `attachment; filename="${filename}"`,

      "Cache-Control": "no-store",

    },

  });

}


