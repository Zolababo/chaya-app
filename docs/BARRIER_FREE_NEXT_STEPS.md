# Barrier-Free Source Recovery Plan

레거시 프로토타입 소스 참고 자산은 아래에 있다.

- `legacy/consumer-app/` (고객용 HTML 프로토타입)
- `legacy/admin-app/` (관리자용 HTML 프로토타입)

`legacy/README.md` 기준으로 해당 파일들은 참고용 자산이며, 새 구현은 **`apps/consumer-menu`**(기존 chaya-app 소비자 앱) 안에서 진행한다.

### 목록형 보조 화면 URL (선택)

- 경로: `/t/{tenant}/barrier-free` — **하단 탭에는 두지 않음**. 메인 메뉴·주문 화면의 **작은 링크**로만 진입 (QR 모바일 UX 우선).
- **베리어프리의 본체는 기본 메뉴·장바구니·주문 화면**에서 스크린리더(TalkBack / VoiceOver)·터치 영역·레이블을 맞추는 것으로 본다.

## 확보 소스 (우선 후보)

### Consumer

- `legacy/consumer-app/index_consumer.html`
- `legacy/consumer-app/Consumer_250921_modified.html`
- `legacy/consumer-app/Consumer_250916_vapid_with_subscription.html`

### Admin (참고)

- `legacy/admin-app/index.html`
- `legacy/admin-app/index_patched.html`

## 바로 다음 단계 (실행 순서)

1. **UI 기준본 선택** — 1차: `legacy/consumer-app/Consumer_250921_modified.html`
2. **요소 추출** — 라벨, 키보드 순서, `aria-live` 등
3. **구현 위치** — `apps/consumer-menu` 라우트·컴포넌트로만 확장 (**별도 Vercel 프로젝트 불필요**)
4. **기능 이식** — 주문 조회·상태는 기존 `consumer-menu`의 RPC 패턴과 동일하게
5. **검증** — 키보드 전용, 스크린리더, 폴링 성능

## 현재 진행 상태 (업데이트)

- [x] UI 기준본 1차 선택
- [x] `consumer-menu` 내 `/t/[tenant]/barrier-free` 라우트 (실데이터 `ChayaMenus` 조회, 실패 시 데모 fallback)
- [x] 하단 내비·메인 메뉴에서 편한 메뉴 진입
- [x] **장바구니 통합**: 편한 메뉴 `담기` → `local-cart` (`addLine`) · 다른 탭 반영 이벤트와 동일
- [x] **주문 동선 노출**: 편한 메뉴에서 장바구니·주문 현황·상세 페이지 링크
- [x] **테넌트 레이아웃**: 본문 `<main id="main-content">` · 키보드용 「본문으로 바로가기」
- [x] 일반 메뉴판(Menuboard): 카테고리 `aria-pressed`, 담기·상세 `aria-label`
- [x] 게스트 주문 목록·상세: 헤딩 연결 (`aria-labelledby`), 목록·상태 `aria-live`·링크 접근 이름, 편한 메뉴·주문 목록 진입 동선
- [x] 메인 메뉴판: 스크린 전용 `h1`「메뉴판」, 하단 내비 한국어 `aria-label`(표시 영어는 `aria-hidden`으로 중복 읽기 완화)
- [x] 주문 허브·편한 메뉴: 주요 링크·버튼 터치 높이, 오류 `aria-live`, 로딩 스켈레톤 `role="status"`
- [x] 주문 상세·찾을 수 없음: 페이지 랜드마크(`aria-labelledby`), 품목 목록 제목 연결, 하단 이동 링크 터치·보조 라벨, 실시간 상태 버튼 `min-h-[44px]`
- [x] 테넌트·주문·메뉴 상세 오류 UI: `role="alert"` + `aria-live="assertive"`, 다시 시도·메뉴 링크 터치 영역
- [x] 메뉴 상세·주문 상세 로딩: `role="status"` + `aria-live="polite"`
- [x] 페이지 랜드마크: 장바구니·주문 허브·목록형 메뉴 최상단을 `aria-labelledby`로 묶고, 메뉴·편한 메뉴 API 안내에 `aria-live` 반영; 스킵 링크 `aria-label` 보강
- [x] 전역 404(`app/not-found.tsx`)·점주 `/m/*` 보조: 새로고침 영역·필터 칩 터치·오류 `aria-live`, 장바구니 요청사항 글자 수 `aria-describedby`
- [ ] 수동 접근성 점검 체크리스트 (아래 항목을 실제 기기에서 확인)
- [x] 스킵 링크: 클릭 시 `#` 대신 `main`에 포커스·스크롤 (`SkipToMainLink` 클라이언트 컴포넌트)

### Supabase 손님 주문 (RPC·RLS) 적용 순서

프로덕션 DB에 아래 마이그레이션이 **순서대로** 반영돼 있어야 손님 주문·목록·상태 폴링이 동작합니다. (`apps/consumer-menu`는 `get_order_status_for_guest` 실패 시 `get_order_for_guest`로 폴백합니다.)

1. `20260425140000_orders_tenant_guest_rls.sql` — `guest_session_id`, RLS
2. `20260425153000_get_order_for_guest_rpc.sql` — 주문 상세 JSON
3. `20260425160000_orders_table_note_status.sql` — `guest_note` 등
4. `20260428120000_list_orders_for_guest_rpc.sql` — 비회원 주문 목록
5. `20260428123000_idx_orders_tenant_guest_created.sql` — 목록 조회 인덱스
6. `20260428140000_get_order_status_for_guest_rpc.sql` — 상태 문자열만 (가벼운 폴링)

로컬: `supabase db push` 또는 대시보드 SQL Editor로 동일 내용 적용.

### 수동 점검 체크리스트 (TalkBack / VoiceOver + 모바일 Chrome·Safari)

1. **본문으로 바로가기**: 첫 포커스에서 링크가 보이고, 활성화 시 본문으로 이동·**포커스가 본문(`main`)으로 옮겨지는지** (키보드·스크린리더).
2. **하단 내비**: 세 탭이 각각 「메뉴판」「장바구니」「주문 현황」으로 읽히는지, 장바구니에 품목이 있을 때 개수가 안내에 포함되는지.
3. **메뉴판**: 카테고리 토글 `aria-pressed`, 담기 후 「장바구니에 담았어요」가 `aria-live`로 읽히는지.
4. **장바구니**: 줄별 삭제·수량·주문 보내기 라벨, 오류·로딩 메시지가 읽히는지.
5. **주문 목록·상세**: 목록 링크 안내, 상태 갱신(폴링) 시 과도한 반복이 없는지(필요 시 동작 줄이기 설정으로 폴링 꺼짐 확인).
6. **목록형 메뉴**: 카테고리 전환 시 상태 알림, 담기·하단 이동 링크가 의미대로 읽히는지.
7. **주문 상세·오류**: 접수 화면 제목·품목 목록이 논리 순서로 읽히는지, 잘못된 주문 번호·세그먼트 오류 시 알림이 읽히는지, 「다시 시도」와 메뉴 링크가 충분히 눌리는지.
8. **메뉴 상세**: 없는 메뉴 URL에서 오류 안내와 「메뉴판으로 돌아가기」가 읽히는지.
9. **페이지 제목·알림**: 장바구니·주문 허브·편한 메뉴에서 첫 스와이프 시 제목 영역이 자연스러운지, 연결 실패 등 안내 문구가 갱신될 때 읽히는지(과도한 반복은 없는지).
10. **존재하지 않는 URL**: 전역 404 문구와 「데모 메뉴판으로」 링크가 읽히는지(실서비스에서는 테넌트별 안내 문구를 바꿀 수 있음).

## 리스크 최소화 원칙

- 법률 자문 없이 진행 중이므로 **신규 오픈소스 도입은 기본 금지**
- 배포는 **`https://chaya-app.vercel.app/`** 에 대응하는 **Vercel 프로젝트 하나**만 유지 (이름 권장: `chaya-app`, Root Directory: `apps/consumer-menu`, 설정은 `docs/DEPLOY_VERCEL.md`)

## 참고

- `docs/ARCHITECTURE.md`
- 구현 코드: `apps/consumer-menu/`
