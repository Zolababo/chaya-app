"use client";

import { useState } from "react";
import { Copy, MoreHorizontal, Share2, Trash2 } from "lucide-react";

import { deleteTenantTableAction } from "@/app/m/[tenant]/tables/actions";
import { MerchantActionSheet } from "@/components/merchant-action-sheet";
import { MerchantTableDeleteSubmit } from "@/components/merchant-table-delete-submit";
import { MerchantTableQrLink } from "@/components/merchant-table-qr-link";

type Props = {
  tenant: string;
  tableId: string;
  tableCode: string;
  consumerUrl: string;
  canManage: boolean;
};

export function MerchantTableRowActions({
  tenant,
  tableId,
  tableCode,
  consumerUrl,
  canManage,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const tEnc = encodeURIComponent(tenant);
  const previewHref = `/m/${tEnc}/tables/${encodeURIComponent(tableCode)}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(consumerUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      setSheetOpen(false);
    } catch {
      /* ignore */
    }
  };

  const onShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `테이블 ${tableCode}`,
          text: `테이블 ${tableCode} 메뉴`,
          url: consumerUrl,
        });
        setSheetOpen(false);
        return;
      }
      await onCopy();
    } catch {
      /* 사용자 취소 */
    }
  };

  return (
    <>
      <MerchantTableQrLink href={previewHref} />
      {canManage ? (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F2F3F5] text-[#9CA3AF] dark:border-zinc-700 dark:bg-zinc-900"
          aria-label={`테이블 ${tableCode} 더보기`}
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}

      <MerchantActionSheet
        open={sheetOpen}
        title={`테이블 ${tableCode}`}
        onClose={() => setSheetOpen(false)}
        actions={[
          {
            label: copied ? "복사됨" : "링크 복사",
            icon: <Copy className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
            onClick: () => void onCopy(),
          },
          {
            label: "공유하기",
            icon: <Share2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
            onClick: () => void onShare(),
          },
          {
            label: "테이블 삭제",
            icon: <Trash2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
            tone: "danger",
            onClick: () => {
              setSheetOpen(false);
              setConfirmDelete(true);
            },
          },
        ]}
      />

      {confirmDelete ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="table-delete-title"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-sm rounded-[18px] bg-white p-6 text-center dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <Trash2 className="h-6 w-6" strokeWidth={2.25} aria-hidden />
            </div>
            <h2 id="table-delete-title" className="text-[17px] font-black text-[#111827] dark:text-zinc-50">
              테이블을 삭제할까요?
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#9CA3AF]">
              삭제하면 이 테이블의 QR로는
              <br />
              더 이상 주문할 수 없어요.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[48px] flex-1 rounded-[10px] bg-[#F2F3F5] text-[15px] font-extrabold text-[#4B5563] dark:bg-zinc-900"
              >
                취소
              </button>
              <form action={deleteTenantTableAction} className="flex-1">
                <input type="hidden" name="tenant_slug" value={tenant} />
                <input type="hidden" name="id" value={tableId} />
                <MerchantTableDeleteSubmit />
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
