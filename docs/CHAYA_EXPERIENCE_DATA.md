# CHAYA 경험 데이터 OS

**우선순위:** 파일럿 단계에서 P0(점주 계정) 다음 축으로 **방문 데이터 설계·확장**이 P2(셀프 가입)보다 앞선다 — `docs/CHAYA_PRODUCT_PRIORITY_PILOT.md` 순서 3.

**마이그레이션:** `20260604120000_consumer_experience_events.sql` · **`20260606120000_merchant_guest_visits.sql`**

## 방문 1사이클 (점주·분석 정본)

**현장 QR 주문:** 손님 주문 접수 → 점주 **`status=completed`(결제완료)** = **방문 1건**.

| 개념 | 근거 |
|------|------|
| 방문 사이클 | `orders.status = completed` 1행 (`store_visits` 1:1) |
| N번째 방문 | 동일 `guest_session_id` 누적 결제완료 횟수 |
| 재방문 손님 | 결제완료 2회 이상 |
| 단골 (UI) | 3회 이상 (`priorCompleted >= 2`) |

**같은 날** 점심·저녁 각각 결제완료 → **방문 2회**.

점주 주문 큐는 **접수(`pending`) 시점부터** 과거 결제완료만 보고 「N번째 방문·단골·지난 주문」 표시 (서비스·결제 시 감사 인사용).

## 이벤트 (보조)

| event_type | 시점 |
|------------|------|
| `qr_scan` | 메뉴판 홈 (탭당 1회) — **점주 KPI 아님** |
| `order_placed` | 주문 접수 성공 |
| `revisit` | 새 탭 재진입 (스캔 이벤트 보조) |

분석·점주 UI는 **`orders` / `store_visits` / `tenant_guest_rollups`** 가 정본.

## DB

| 테이블 | 용도 |
|--------|------|
| `orders.completed_at` | 결제완료 시각 |
| `store_visits` | 결제완료 1건당 1행, `visit_number` |
| `tenant_guest_rollups` | 매장×세션 누적 (서버 upsert) |

INSERT는 **service role**만. 점주 UI에는 **가명 `#ABC`** 만 노출.

## guest_session

- `/t/{tenant}/layout` — `GuestSessionInit`
- `chaya_guest_session` localStorage + 쿠키

**유지:** 주문 URL에 세션 미노출(C6 전).
