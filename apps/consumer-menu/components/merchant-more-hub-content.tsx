"use client";

import {
  Armchair,
  Bell,
  Headphones,
  KeyRound,
  Pencil,
  Smartphone,
} from "lucide-react";

import { MerchantMoreHoursAccordion } from "@/components/merchant-more-hours-accordion";
import { MerchantMoreHubLogout } from "@/components/merchant-more-hub-logout";
import {
  MerchantSettingsChevron,
  MerchantSettingsIconBox,
  MerchantSettingsRow,
  MerchantSettingsRowDivider,
  MerchantSettingsSection,
} from "@/components/merchant-settings-sheet-ui";
import { merchantLoginUsesSms } from "@/lib/merchant/merchant-login-mode";
import type { MerchantSettingsSheetSnapshot } from "@/lib/merchant/merchant-settings-sheet-types";

/** `/more` 허브 — Claude 목업 (영업 설정만 펼치기) */
export function MerchantMoreHubContent({
  tenant,
  ordersAccepting,
  breakStart,
  breakEnd,
  tableCount,
  canManageTables,
  canManageHours,
}: MerchantSettingsSheetSnapshot) {
  const base = `/m/${encodeURIComponent(tenant)}`;
  const useSms = merchantLoginUsesSms();

  return (
    <div className="space-y-0">
      <MerchantSettingsSection label="매장 운영">
        <MerchantSettingsRow
          href={`${base}/more/store`}
          icon={<MerchantSettingsIconBox icon={Pencil} accent="orange" />}
          title="매장 정보"
          sub="매장명 · 로고"
          trailing={<MerchantSettingsChevron />}
        />
        <MerchantSettingsRowDivider />
        <MerchantMoreHoursAccordion
          tenant={tenant}
          ordersAccepting={ordersAccepting}
          breakStart={breakStart}
          breakEnd={breakEnd}
          canEdit={canManageHours}
        />
        {canManageTables ? (
          <>
            <MerchantSettingsRowDivider />
            <MerchantSettingsRow
              href={`${base}/tables`}
              icon={<MerchantSettingsIconBox icon={Armchair} accent="blue" />}
              title="테이블 · QR"
              sub="추가 · 삭제 · QR 보기"
              trailing={
                <>
                  {tableCount != null ? (
                    <span className="text-[13px] font-bold text-[#9CA3AF]">{tableCount}개</span>
                  ) : null}
                  <MerchantSettingsChevron />
                </>
              }
            />
          </>
        ) : null}
      </MerchantSettingsSection>

      <MerchantSettingsSection label="알림">
        <MerchantSettingsRow
          href={`${base}/more/notifications`}
          icon={<MerchantSettingsIconBox icon={Bell} accent="orange" />}
          title="주문 알림"
          sub="알림음 · 진동 · 푸시"
          trailing={<MerchantSettingsChevron />}
        />
      </MerchantSettingsSection>

      <MerchantSettingsSection label="계정 및 보안">
        {!useSms ? (
          <>
            <MerchantSettingsRow
              href={`${base}/more/account`}
              icon={<MerchantSettingsIconBox icon={KeyRound} accent="gray" />}
              title="비밀번호 변경"
              trailing={<MerchantSettingsChevron />}
            />
            <MerchantSettingsRowDivider />
          </>
        ) : null}
        <MerchantSettingsRow
          href={`${base}/more/staff`}
          icon={<MerchantSettingsIconBox icon={Smartphone} accent="gray" />}
          title="로그인 기기"
          sub="이 기기 · 로그아웃"
          trailing={<MerchantSettingsChevron />}
        />
      </MerchantSettingsSection>

      <MerchantSettingsSection label="고객센터">
        <MerchantSettingsRow
          href={`${base}/more/support`}
          icon={<MerchantSettingsIconBox icon={Headphones} accent="gray" />}
          title="고객센터"
          sub="이메일 문의"
          trailing={<MerchantSettingsChevron />}
        />
      </MerchantSettingsSection>

      <MerchantMoreHubLogout />

      <p className="pb-2 pt-3 text-center text-[11px] font-medium text-[#9CA3AF]">
        © 2026 CHAYA Platform
      </p>
    </div>
  );
}
