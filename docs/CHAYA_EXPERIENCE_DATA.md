# CHAYA 경험 데이터 OS

**우선순위:** 파일럿 단계에서 P0(점주 계정) 다음 축으로 **방문 데이터 설계·확장**이 P2(셀프 가입)보다 앞선다 — `docs/CHAYA_PRODUCT_PRIORITY_PILOT.md` 순서 3.

**마이그레이션:** `supabase/migrations/20260604120000_consumer_experience_events.sql`

## 이벤트

| event_type | 시점 |
|------------|------|
| `qr_scan` | `/t/{tenant}` 메뉴판 홈 (브라우저 **탭당 1회**) |
| `menu_view` | **기본 OFF** (`CONSUMER_EXPERIENCE_TRACK_MENU_VIEW`) — 로그 과다 방지 |
| `order_placed` | **주문 건마다 1행** (`submitGuestOrder` 성공). 같은 방문에서 음료만 추가 주문해도 2건이면 2행 — 재방문이 아님 |
| `revisit` | **탭을 새로 연 뒤** 홈 첫 `qr_scan` 시, DB에 과거 `qr_scan`이 있을 때만 (같은 탭에서 홈만 왔다 갔다 한 것은 아님) |

## 분석할 때

| 질문 | 보면 되는 것 |
|------|----------------|
| 몇 번 왔나 / 재방문 | `qr_scan`, `revisit`, `guest_session_id` distinct |
| 몇 번 주문했나 / 매출 | `order_placed` 또는 **`orders`** (주문 원장은 `orders`가 정확) |
| 한 방문에서 주문했나 | 그 `guest_session_id`에 `order_placed` 또는 `orders` 1건 이상 |

`order_placed`를 방문당 1회로 줄이면 추가 주문(2차 주문)이 경험 로그에서 빠져 분석이 틀어집니다.

## guest_session

- `/t/{tenant}/layout` — `GuestSessionInit` (진입 시 UUID)
- `chaya_guest_session` localStorage + 쿠키

## 검증 SQL

```sql
SELECT event_type, count(*), tenant_slug
FROM consumer_experience_events
GROUP BY event_type, tenant_slug
ORDER BY count DESC;
```

## 로드맵 — `store_visit` (설계 예정)

현재는 이벤트 스트림(`qr_scan`, `revisit`, `order_placed`)과 **`orders` 원장**으로 방문·재방문·주문을 분석한다.  
다음 단계(제품 우선순위 **순서 3**)에서 검토할 항목:

| 목표 | 메모 |
|------|------|
| 방문 단위 행 | 예: `store_visit` — `tenant_slug`, `guest_session_id`, 시작 시각, (선택) 테이블·UTM |
| 재방문 | 기존 `revisit` 이벤트와 통합·중복 정의 정리 |
| 방문 이력 | 세션·테넌트별 타임라인 (Ops/점주 리포트는 후속) |
| 체류 | `dwell_seconds` — 스펙 확정 후, 로그 과다 방지 패턴은 `menu_view` OFF와 동일 원칙 |

**유지:** `guest_session_id` 조기 발급(`GuestSessionInit`), 주문 URL에 세션 미노출(C6 전).
