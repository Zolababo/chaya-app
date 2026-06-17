# CHAYA 반응형 QA Runbook

손님(`/t/*`)·점주(`/m/*`)·플랫폼(`/ops/*`) 공통 셸과 가로 2-pane 레이아웃을 실기기에서 빠르게 확인하는 체크리스트입니다.

**프로덕션:** https://chaya-app.vercel.app

## 공통 브레이크포인트

| 모드 | 조건 | 점주 네비 | ops 네비 |
|------|------|-----------|----------|
| 폰·태블릿 터치 | `(pointer: coarse)` 또는 `(hover: none)` | 하단 4탭 (세로 또는 가로 미만 1024) | **하단 5탭 + 컴팩트 헤더** |
| 점주 넓은 가로 | `min-width: 1024px` **and** `orientation: landscape` | 상단 서브내비 | — |
| **ops PC** | `(hover: hover) and (pointer: fine)` | — | **사이드바 + 탑바** |
| ops PC 넓은 창 | 위 + `min-width: 1024px` | — | KPI 4열·매장 2-pane |

CSS·상수: `ops-desktop-view.ts`, `chaya-ops-shell.ts`, `app/globals.css`.  
ops는 **가로/세로가 아니라 PC(마우스) vs 터치** 로 셸을 분리합니다.

## 손님 `/t/{tenant}`

- 본문·헤더·하단 nav·장바구니 bar: **512px** (`--chaya-shell-max-consumer`) 동일 컬럼
- 확인: 메뉴 → 장바구니 sticky bar → 하단 탭 가로 정렬

### 기기

- [ ] Galaxy S24 세로 — 메뉴판·주문·로그인 컬럼 정렬
- [ ] iPad 세로 — 손님 화면이 폰과 비슷한 좁은 컬럼(양쪽 여백)

## 점주 `/m/{tenant}`

### 세로 (폰·iPad portrait)

- [ ] 하단 4탭(홈·주문·메뉴·분석) 유지 — `/menus/{id}`, `/orders` 서브경로에서도 해당 탭 **활성**
- [ ] 주문: 카드 목록 한 열
- [ ] 메뉴: 카테고리 블록 목록
- [ ] 분석: 요약 → 차트 세로 스택

### 가로 (iPad landscape, 1024px+)

- [ ] 하단 4탭 **숨김**, 상단 서브내비 표시
- [ ] **주문**: 왼쪽 compact 목록 + 오른쪽 상세·처리 버튼 (`?order=`)
- [ ] **메뉴**: 왼쪽 compact + 오른쪽 미리보기 → 상세 수정 → 목록+편집 폼
- [ ] **메뉴 추가** (`/menus/new`): 왼쪽 목록 + 「새 메뉴 등록 중」 + 오른쪽 추가 폼, 뒤로가기 숨김
- [ ] **분석**: 왼쪽 요약 sticky + 오른쪽 차트 2열, 기간 칩 sticky
- [ ] **홈(대시보드)**: 가로에서 왼쪽 오늘 매출 sticky + 오른쪽 주문 현황·메뉴 빠른 수정 (세로는 주문 → 매출 순)

## 플랫폼 `/ops/*`

### 터치·폰 (모바일 셸)

- [ ] 하단 5탭 + CHAYA Admin 컴팩트 헤더
- [ ] 본문·하단 nav **512px** 정렬 (`OpsConsoleFrame`)
- [ ] iPad·폰 **가로로 돌려도** 하단 탭 유지 (터치 = 컴팩트)

### PC (마우스·`(hover: hover) and (pointer: fine)`)

- [ ] 사이드바 + 탑바, 하단 탭·컴팩트 헤더 **없음** (`data-ops-shell="desktop"`)
- [ ] 창 너비 1024px+ 이면 KPI 4열·매장 2-pane·주문 테이블
- [ ] PC에서 창을 좁혀도 **사이드바 셸 유지** (본문만 1~2열)

### 인증·역할 선택

- [ ] `/m/login`, `/m`(가게 선택), `/m/forbidden`, `/m/access-pending` — **28rem** (`chayaAuthShellClass`)
- [ ] `/ops/login` — 동일 인증 컬럼

## 회귀 포인트

- [ ] safe-area (노치·홈 인디케이터) — 헤더·하단 nav 잘림 없음
- [ ] 주문/메뉴 2-pane에서 첫 항목 자동 선택
- [ ] 탭 전환 시 `?order=` / `?menu=` 초기화(탭 링크에 미포함)

## 로컬 빌드

```bash
cd apps/consumer-menu
npm run build
```

배포(저장소 루트):

```bash
npx vercel deploy --prod --yes
```
