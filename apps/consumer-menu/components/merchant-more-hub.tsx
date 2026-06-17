"use client";

import {
  Bell,
  Clock,
  Download,
  Headphones,
  KeyRound,
  LogOut,
  QrCode,
  Smartphone,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

import { MerchantMoreSection, type MerchantMoreRow } from "@/components/merchant-more-section";
import {
  MERCHANT_APP_VERSION,
  MERCHANT_SUPPORT_EMAIL,
  MERCHANT_SUPPORT_HOURS,
} from "@/lib/merchant/merchant-app-meta";
import { merchantLoginUsesSms } from "@/lib/merchant/merchant-login-mode";

type Props = {
  tenant: string;
  storeName: string;
  ordersAccepting: boolean;
  canManageStore: boolean;
  canManageHours: boolean;
  canManageTables: boolean;
  canViewStaff: boolean;
  canUseNotifications: boolean;
  canExportSales: boolean;
};

function statusBadge(open: boolean): string {
  return open ? "🟢 영업중" : "🔴 주문 마감";
}

export function MerchantMoreHub({
  tenant,
  storeName,
  ordersAccepting,
  canManageStore,
  canManageHours,
  canManageTables,
  canViewStaff,
  canUseNotifications,
  canExportSales,
}: Props) {
  const t = encodeURIComponent(tenant);
  const base = `/m/${t}`;
  const useSms = merchantLoginUsesSms();

  const storeRows: MerchantMoreRow[] = canManageStore
    ? [
        {
          kind: "link",
          href: `${base}/more/store`,
          label: "매장 정보",
          description: "매장명 · 로고",
          icon: Store,
        },
      ]
    : [
        {
          kind: "link",
          href: `${base}/more/store`,
          label: "매장 정보",
          description: "조회 전용 · 변경은 소장 계정",
          icon: Store,
          disabled: false,
        },
      ];

  const hoursRows: MerchantMoreRow[] = [
    {
      kind: "link",
      href: `${base}/more/hours`,
      label: canManageHours ? "영업 설정" : "영업 상태",
      description: canManageHours
        ? `${statusBadge(ordersAccepting)} · 브레이크타임 설정`
        : statusBadge(ordersAccepting),
      icon: Clock,
      badge: ordersAccepting ? "영업중" : "마감",
    },
  ];

  const tableRows: MerchantMoreRow[] = canManageTables
    ? [
        {
          kind: "link",
          href: `${base}/tables`,
          label: "테이블 (QR) 관리",
          description: "추가 · 삭제 · QR 다운로드 · 인쇄",
          icon: QrCode,
        },
      ]
    : [];

  const staffRows: MerchantMoreRow[] = canViewStaff
    ? [
        {
          kind: "link",
          href: `${base}/more/staff`,
          label: "로그인 · 기기",
          description: "계정 1개 · 폰·태블릿 동시 사용",
          icon: Users,
        },
      ]
    : [];

  const notifyRows: MerchantMoreRow[] = canUseNotifications
    ? [
        {
          kind: "link",
          href: `${base}/more/notifications`,
          label: "알림 설정",
          description: "주문 알림음 · 진동 · 웹 푸시 · 카카오(준비중)",
          icon: Bell,
        },
      ]
    : [];

  const exportRows: MerchantMoreRow[] = canExportSales
    ? [
        {
          kind: "link",
          href: `${base}/more/export`,
          label: "정산 · 매출 내보내기",
          description: "최근 30일 주문 CSV",
          icon: Download,
        },
      ]
    : [];

  const sections: { title: string; description?: string; rows: MerchantMoreRow[]; icon?: LucideIcon }[] =
    [
      { title: "1. 매장 설정", rows: storeRows },
      { title: "2. 영업 설정", rows: hoursRows },
      ...(tableRows.length ? [{ title: "3. 테이블 (QR) 관리", rows: tableRows }] : []),
      ...(staffRows.length ? [{ title: "4. 로그인 · 기기", rows: staffRows }] : []),
      ...(notifyRows.length ? [{ title: "5. 알림 설정", rows: notifyRows }] : []),
      ...(exportRows.length ? [{ title: "6. 정산 · 매출 내보내기", rows: exportRows }] : []),
    ];

  return (
    <div aria-label="더보기 메뉴">
      {sections.map((section) => (
        <MerchantMoreSection
          key={section.title}
          title={section.title}
          description={section.description}
          rows={section.rows}
        />
      ))}

      <MerchantMoreSection
        title="7. 앱 정보"
        rows={[
          {
            kind: "custom",
            key: "version",
            node: (
              <div className="flex min-h-[56px] items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Smartphone className="h-5 w-5 text-zinc-700 dark:text-zinc-200" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
                    앱 버전
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    CHAYA 점주 · v{MERCHANT_APP_VERSION}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-bold tabular-nums text-zinc-500">v{MERCHANT_APP_VERSION}</span>
              </div>
            ),
          },
        ]}
      />

      <MerchantMoreSection
        title="8. 고객센터"
        rows={[
          {
            kind: "custom",
            key: "support",
            node: (
              <a
                href={`mailto:${MERCHANT_SUPPORT_EMAIL}?subject=${encodeURIComponent(`[CHAYA] ${storeName} 문의`)}`}
                className="flex min-h-[56px] items-center gap-3 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/80"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Headphones className="h-5 w-5 text-zinc-700 dark:text-zinc-200" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
                    고객센터
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {MERCHANT_SUPPORT_EMAIL} · {MERCHANT_SUPPORT_HOURS}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-chaya-primary">→</span>
              </a>
            ),
          },
        ]}
      />

      <MerchantMoreSection
        title="9. 계정"
        rows={[
          ...(useSms
            ? []
            : [
                {
                  kind: "link" as const,
                  href: `${base}/more/account`,
                  label: "비밀번호 · 계정",
                  description: "비밀번호 변경 · 로그인 이메일",
                  icon: KeyRound,
                },
              ]),
          {
            kind: "custom",
            key: "logout",
            node: (
              <form action="/m/logout" method="post" className="px-4 py-3">
                <button
                  type="submit"
                  className="flex min-h-[48px] w-full items-center gap-3 rounded-xl bg-zinc-50 px-3 text-left transition hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    <LogOut className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="text-[15px] font-semibold text-red-700 dark:text-red-300">로그아웃</span>
                </button>
              </form>
            ),
          },
        ]}
      />
    </div>
  );
}
