# 손님 QR·테넌트 연결 (운영)

**범위:** 매장이 QR로 `/t/{tenant_slug}` 에 들어오게 하는 설정. **C6**(토큰·주문 중지·rate limit)은 `docs/QR_AND_GUEST_ORDERS.md` §4 — 별도 일정.

---

## 1. `tenant_slug` 정하기

- 영문·숫자·하이픈 (예: `demo`, `bukchang-dong`)
- URL: `https://chaya-app.vercel.app/t/{tenant_slug}`
- 테이블 번호(선택): `?table=12`

---

## 2. DB — 메뉴와 slug 맞추기

`ChayaMenus` 각 행의 **`tenant_slug`** 가 위 slug 와 같아야 손님 메뉴판에 보입니다.

- 마이그레이션: `20260415130000_chaya_menus_tenant_slug.sql`
- 신규 매장: 점주 **메뉴 관리** (`/m/{slug}/menus`)에서 추가·수정

---

## 3. 점주 앱에서 주소 확인

1. `/m/login` 로그인
2. **`/m/{tenant_slug}/dashboard`**
3. **「손님 QR·메뉴 주소」** 카드에서
   - **메뉴 URL 복사** → QR 생성 사이트에 붙여넣기
   - **테이블 예시 복사** → 테이블마다 `?table=` 만 바꿔 인쇄

`NEXT_PUBLIC_SITE_URL` 이 Vercel에 있으면 **전체 https URL** 이 보입니다. 없으면 경로만 표시됩니다.

---

## 4. QR 인쇄·테스트

1. 폰으로 QR 스캔 → 메뉴·담기·**주방으로 주문 보내기** 까지 1회
2. 점주 **주문** (`/m/{slug}/orders`) 에 pending 표시 확인
3. 자동 점검: `pnpm smoke:consumer -- --tenant <slug>`

---

## 5. 플랫폼(`/ops`) 신규 매장

`/ops/merchants` 에서 테넌트·점주 초대 후, 위 2~4 반복.

---

## 관련

- `docs/QR_AND_GUEST_ORDERS.md`
- `docs/CONSUMER_C2_VERIFICATION.md`
- `docs/CONSUMER_C2_MANUAL_RUNBOOK.md`
