# 소비자앱 C2 신뢰·검증 체크리스트

**범위:** `/t/*` 게스트 주문·조회 (결제 PG·직원 호출 UI 제외).  
**프로덕션:** https://chaya-app.vercel.app  
**자동 스모크:** `pnpm smoke:consumer -- --tenant <tenant_slug>`

---

## 1단계 — 자동 스모크 (CI·로컬)

| 항목 | 기준 | 상태 |
|------|------|------|
| `/health` | `ok: true`, `supabase.configured` | ✅ (2026-05-15, `demo`) |
| `guestOrderRpcsProbe` | `probed: true` → `allPresent: true` | ✅ |
| `/t/{tenant}` | 메뉴 SSR 마커 | ✅ |
| `/t/{tenant}/orders` | 「주문 현황」 | ✅ |
| `/t/{tenant}/cart` | 「주문 확인」 | ✅ |
| `/t/{tenant}/barrier-free` | 「목록형 메뉴」 | ✅ |
| `GET …/checkout/payment` | **405** | ✅ |
| `GET …/staff-call` | **405** | ✅ |
| `robots.txt` | `/m` disallow | ✅ |
| `/t/{tenant}/cart` C2 | 카운터 결제 안내 + 「주방으로」 CTA | ✅ (스모크) |
| `/t/{tenant}` skip | 「본문으로」 스킵 링크 | ✅ (스모크) |
| `/t/{tenant}/menu/*` | 수량 + 「장바구니에 담기」(메뉴 있을 때) | ✅ (스모크) |

수동 3~4단계: `docs/CONSUMER_C2_MANUAL_RUNBOOK.md`

재실행:

```bash
pnpm smoke:consumer -- --tenant demo
```

---

## 2단계 — Supabase RPC (운영 DB)

프로덕션에 마이그레이션 1~8 적용 후 `supabase/scripts/verify_guest_order_rpcs.sql` 로 ①~⑤ 확인.  
`/health` 의 `guestOrderRpcsProbe.allPresent: true` 이면 앱·서비스 롤 기준 RPC 호출은 통과한 상태로 본다.

| 항목 | 상태 |
|------|------|
| ① RPC 3종 | ✅ (health probe) |
| ② 시그니처 `uuid,text,text` | ✅ (적용·주문 상세 동작 확인) |
| ③~⑤ 컬럼·RLS·EXECUTE | 운영에서 SQL 스크립트로 주기 점검 권장 |

---

## 3단계 — 수동 동선 (실기기·브라우저)

매장 `tenant_slug` 로 아래를 한 번씩 확인한다 (`BARRIER_FREE_NEXT_STEPS.md` 와 동일).

- [ ] 메뉴 담기 → 장바구니 → **주방으로 주문 보내기** → 접수 화면
- [ ] 주문 진행 단계(접수·조리·준비) 표시
- [ ] 하단 **주문** 탭에서 목록·상세·상태 폴막
- [ ] **이 주문 주소 복사** / 공유 (지원 브라우저)
- [ ] 시크릿 창에서 같은 URL → 「주문을 찾을 수 없습니다」(세션 제한)
- [ ] 카운터 결제 안내 문구 (장바구니·주문 상세)

---

## 4단계 — 접근성 (수동, 기기별)

- [ ] TalkBack / VoiceOver: 메뉴·장바구니·주문·하단 탭 한국어
- [ ] 키보드만: 스킵 링크 → 본문, 카테고리 칩, 담기
- [ ] `prefers-reduced-motion`: 주문 상태 자동 폴링 안내

---

## 제품 정책 (고정)

- **셀프바 안내:** UI 제거 (`CONSUMER_SELF_BAR_HINT_ENABLED = false`)
- **결제:** 앱 내 PG 없음, 카운터 오프라인
- **직원 호출:** UI 숨김, 스텁만

---

## C2 완료 기준 (팀 합의안)

- **자동 1~2단계 통과** → C2 **코드·운영 검증 완료** (~85% 구간)
- **3~4단계** → 실매장·접근성은 병행 운영 중 체크 (완료 시 C2 **100%**에 가깝게 표기)
