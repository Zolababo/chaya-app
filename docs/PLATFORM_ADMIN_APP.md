# CHAYA 플랫폼 관리자 앱 (`/ops/*`)

차야 **플랫폼 운영자** 전용 UI. 점주(`/m/*`)·손님(`/t/*`)과 **경로·권한·브랜드 색**을 분리합니다.

**사용 맥락:** 출근길 30초 플랫폼 체크, 점심 영업중 매장 확인, 저녁 성장 분석, 이상 징후 즉시 대응.

## 지금 (웹 MVP)

**레이아웃:** PC 우선 — `lg`(1024px)+ 좌측 사이드바(224px) + 탑바 + 스크롤 본문 · 모바일은 하단 5탭.

| 탭 | 경로 | 상태 |
|----|------|------|
| 대시보드 | `/ops/dashboard` | KPI 4열, 7일 매출 차트, 이상 징후, 순위·퍼널·시스템 |
| 매장 | `/ops/stores`, `/ops/stores/[slug]` | 필터·테이블·PC 슬라이드 패널 |
| 분석 | `/ops/data` | 기간 필터(오늘~연간), 메뉴 Top 5, 리텐션 코호트, 퍼널 |
| 수익 | `/ops/revenue` | 파이프라인, **QR 접속 집계** |
| 설정 | `/ops/settings` | `/health` 연동, 공지 발송, **CSV 내보내기** |
| 검색 | `/ops/search?q=` | 매장·메뉴 통합 검색 (탑바) |

**인증:** `platform_operators` + `requirePlatformOperator`  
**집계:** `lib/platform/*` (service role, 서버 전용)

**테마:** `#07090F` 배경 · `#0D1117` 카드 · `#5B6BF8` 인디고

## 공지 발송

- **경로:** `/ops/settings` → 공지 발송 카드
- **저장:** `merchant_notification_events` · `kind = platform_announcement`
- **표시:** 점주 `/m/[tenant]/notifications`
- **DB:** 마이그레이션 `20260601120000_merchant_notification_platform_announcement.sql` Supabase 적용 필요
- **감사:** `ops.platform_announcement` (`merchant_audit_events`)

## 디자인 (Claude 목업)

- PC: 사이드바 섹션(메인/운영/데이터), 탑바 검색·알림 배지
- 사이드바 **매장 관리** 배지 = 이탈 위험 매장 수
- 공통 UI: `components/ops/ops-ui.tsx`, `ops-store-detail-panel.tsx`

### 플랫폼 건강 점수 (매장당 100점)

| 항목 | 배점 |
|------|------|
| 메뉴 5개 이상 | +20 |
| 메뉴 사진 1개 이상 | +10 |
| 최근 7일 주문 | +30 |
| 점주앱 3일 이내 활동 | +20 |
| QR(테이블) 발급 | +20 |

### 이상 징후 (홈)

- 취소율 30%+ (당일 3건 이상)
- 14일+ 주문 없음 (이탈 위험)
- 가입 7일+ 메뉴 미등록
- 새벽(02~05 KST) 비정상 주문 3건+

## MVP 이후

- **완료(2026-06):** 분석 기간 필터 · 매장 CSV · QR 접속 집계 · 아침 브리핑 미리보기
- **다음:** QR 집계 cron·체류시간, 아침 브리핑 자동 발송(cron·Resend), 분기/연간 고도화

## 로컬 확인

1. `platform_operators`에 본인 `user_id` 등록
2. `/ops/login` → `/ops/dashboard`
3. 공지 테스트: `/ops/settings` 발송 → `/m/{tenant}/notifications` 확인
4. Supabase에 마이그레이션 적용:
   - `20260601120000_merchant_notification_platform_announcement.sql` (공지)
   - `20260601130000_tenant_qr_visits.sql` (QR 접속)
