"use client";

import Link from "next/link";

import { chayaSurfaceCardPaddedClass } from "@/components/menu-list-styles";
import { useMerchantPendingCount } from "@/lib/merchant/merchant-pending-count-context";

type CheckItem = {
  id: string;
  title: string;
  detail: string;
  status: "ok" | "warn" | "info";
  href?: string;
  hrefLabel?: string;
};

type Props = {
  tenant: string;
  menuCount: number;
  activeTableCount: number;
  canManageMenus: boolean;
  canManageTables: boolean;
};

function statusBadge(status: CheckItem["status"]): { label: string; className: string } {
  switch (status) {
    case "ok":
      return {
        label: "완료",
        className:
          "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
      };
    case "warn":
      return {
        label: "확인 필요",
        className: "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100",
      };
    default:
      return {
        label: "안내",
        className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
      };
  }
}

export function MerchantReadinessOwnerChecklist({
  tenant,
  menuCount,
  activeTableCount,
  canManageMenus,
  canManageTables,
}: Props) {
  const t = encodeURIComponent(tenant);
  const { pendingCount: pendingOrderCount } = useMerchantPendingCount();

  const items: CheckItem[] = [
    {
      id: "menus",
      title: "메뉴 등록",
      detail:
        menuCount > 0
          ? `등록된 메뉴 ${menuCount}개 — 손님 메뉴판에 표시됩니다.`
          : "메뉴가 없으면 손님이 주문할 수 없습니다.",
      status: menuCount > 0 ? "ok" : "warn",
      href: canManageMenus ? `/m/${t}/menus` : `/t/${t}`,
      hrefLabel: menuCount > 0 ? "메뉴 확인" : canManageMenus ? "메뉴 추가" : "손님 메뉴 보기",
    },
    {
      id: "tables",
      title: "테이블 QR",
      detail:
        activeTableCount > 0
          ? `활성 테이블 ${activeTableCount}개 — QR을 인쇄해 테이블에 붙이세요.`
          : "테이블 번호·QR을 등록하면 손님이 스캔해 주문합니다.",
      status: activeTableCount > 0 ? "ok" : "warn",
      href: canManageTables ? `/m/${t}/tables` : undefined,
      hrefLabel: canManageTables ? (activeTableCount > 0 ? "테이블·QR" : "테이블 추가") : undefined,
    },
    {
      id: "preview",
      title: "손님 화면 확인",
      detail: "메뉴·가격·품절이 매장에서 보이는 것과 같은지 새 탭에서 확인하세요.",
      status: "info",
      href: `/t/${t}`,
      hrefLabel: "손님 메뉴판 열기",
    },
    {
      id: "orders",
      title: "주문 받기 연습",
      detail:
        pendingOrderCount != null && pendingOrderCount > 0
          ? `지금 대기 주문 ${pendingOrderCount}건 — 주문 큐에서 상태를 바꿔 보세요.`
          : "QR로 테스트 주문을 넣은 뒤, 주문 큐에 들어오는지 확인하세요.",
      status: pendingOrderCount != null && pendingOrderCount > 0 ? "info" : "info",
      href: `/m/${t}/orders`,
      hrefLabel: "주문 큐",
    },
    {
      id: "alerts",
      title: "새 주문 알림",
      detail:
        "알림 설정에서 주방 알람·재알림·브라우저 푸시를 켜 두세요. 화면에 안 뜨면 손님이 카운터에서 불러 달라고 안내하는 것도 백업입니다.",
      status: "info",
      href: `/m/${t}/more/notifications`,
      hrefLabel: "알림 설정",
    },
  ];

  return (
    <section className={chayaSurfaceCardPaddedClass} aria-label="오픈 전 체크">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">오픈 전 체크</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        아래를 순서대로 확인하면 실매장에서 막히는 경우가 줄어듭니다.
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item, index) => {
          const badge = statusBadge(item.status);
          return (
            <li
              key={item.id}
              className="rounded-xl border border-chaya-border bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  <span className="mr-2 tabular-nums text-zinc-400">{index + 1}.</span>
                  {item.title}
                </p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.detail}</p>
              {item.href && item.hrefLabel ? (
                <Link
                  href={item.href}
                  {...(item.href.startsWith("/t/") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="mt-2 inline-flex min-h-[40px] items-center text-sm font-semibold text-chaya-primary underline-offset-2 hover:underline"
                >
                  {item.hrefLabel} →
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
