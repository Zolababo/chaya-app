# CHAYA 플랫폼 — 구조 설계 (v0.1)

기존 프로토타입(`legacy/consumer-app`, `legacy/admin-app`, Supabase 단일 HTML + CDN)에서 얻은 **도메인 자산**을 살리고, **보안·배리어프리·4개 앱**을 전제로 한 **새 아키텍처**의 첫 걸음이다.  
구현 세부는 합의에 따라 조정한다.

---

## 1. 목표와 원칙

| 원칙 | 의미 |
|------|------|
| **보안 우선** | 브라우저에는 **anon 공개 키만**. 민감 연산·관리자 권한·웹푸시 서명 등은 **서버(Edge / Route Handler / Server Action)에서만**. |
| **접근성(배리어프리)은 스펙** | UI 패키지는 **WAI-ARIA 준수 컴포넌트** 기반. 목표는 **WCAG 2.1 AA**에 맞춘 설계·검증 프로세스. |
| **데이터 경계** | 테넌트(가게) 단위 격리 + 역할(소비자 / 점주 / 플랫폼). **플랫폼 전권**은 “무제한 DB URL”이 아니라 **감사 가능한 관리 콘솔 + 정책**으로 표현. |
| **단계적 확장** | ① 주문·승인 파이프 안정 → ② 자동 경험 로그 → ③ 소셜·피드. |

---

## 2. 레거시에서 가져올 것 / 버릴 것

**가져올 것 (도메인·UX)**

- 메뉴·카테고리·장바구니·주문 INSERT, 점주 쪽 주문 목록·메뉴 CRUD 흐름.
- 스토리지에 메뉴 이미지(`menu-images` 등)를 두는 방식(이름은 스키마 정리 시 정규화 가능).
- 푸시 구독(`push_subscriptions`) 개념 — **키·로직은 클라이언트에 두지 않고** 서버로 이전.

**버릴 것 (구조)**

- 단일 HTML에 React + Babel + **하드코딩된 키**.
- “클라이언트 Supabase만으로 관리자 기능” 패턴.

**레거시 테이블 참고 (현 코드 기준)**  
`ChayaMenus`, `orders`, `push_subscriptions` — 새 스키마에서는 **스네이크 케이스·정규화·RLS**로 재정의하는 것을 권장한다.

---

## 3. 추천 기술 스택 (검증된 조합)

| 영역 | 선택 | 이유 |
|------|------|------|
| **모노레포** | **pnpm** + **Turborepo** | 앱 4개·공유 UI·빌드 캐시. |
| **웹 프레임워크** | **Next.js (App Router)** × 4앱 | 서버에서 시크릿 처리, RSC, 라우팅·국제화·접근성 생태계. |
| **UI·UX** | **Radix UI** + **Tailwind CSS** + 자체 `packages/ui` | 키보드·스크린리더·포커스 관리에 유리. shadcn 스타일로 **복사-소유** 컴포넌트 권장. |
| **폼·검증** | **React Hook Form** + **Zod** | 오류 메시지·검증을 접근 가능하게 연결하기 쉬움. |
| **서버 상태** | **TanStack Query** | 캐시·로딩·에러 UX 일관. |
| **백엔드** | **Supabase** (Postgres + Auth + Storage + RLS + Edge Functions) | 기존 방향 유지. |
| **품질** | **ESLint** (jsx-a11y), **TypeScript strict**, CI에서 **axe** 또는 유사 검사(단계적). |

모바일 웹/PWA는 **소비자 메뉴·로그 앱**부터 우선 적용한다.

---

## 4. 저장소 디렉터리 구조 (제안)

```
chaya-app/
├── apps/
│   ├── consumer-menu/        # ① 손님: 메뉴·주문 (배리어프리 인증 주력 타깃)
│   ├── merchant-console/     # ② 점주: 메뉴·주문·승인·알림
│   ├── platform-console/     # ③ 플랫폼(당신): 테넌트·감사·전역 설정
│   └── consumer-log/       # ④ 손님: 승인 후 자동 로그·소셜(단계적)
├── packages/
│   ├── ui/                   # @chaya/ui — 디자인 토큰, Button, Dialog, …
│   ├── config/               # 공유 ESLint / TSConfig / Tailwind preset
│   ├── db/                   # Supabase 클라이언트 팩토리(anon vs server-only)
│   └── types/                # 공유 타입·Zod 스키마(주문·메뉴·로그 이벤트)
├── supabase/                 # 마이그레이션, RLS, Edge Functions (기존 확장)
├── docs/
│   └── ARCHITECTURE.md       # 본 문서
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

**호스트·경로 예시 (배포 시)**

- `menu.chaya.example` → consumer-menu  
- `merchant.chaya.example` → merchant-console  
- `ops.chaya.example` → platform-console (IP 제한·SSO 권장)  
- `log.chaya.example` → consumer-log  

한 도메인 하위 경로(`/m/`, `/ops/`)로 묶을지는 **보안·쿠키·CSP** 정책과 함께 결정.

---

## 5. 앱별 책임

| 앱 | 사용자 | 핵심 기능 |
|----|--------|-----------|
| **consumer-menu** | 비로그인 또는 약한 신원 | 메뉴 탐색, 장바구니, 주문 생성. **주문 UX는 인증 대상 화면.** |
| **merchant-console** | 점주·직원 | 메뉴/이미지, 주문 큐, 승인/거절, 푸시 연동. **테넌트 스코프만.** |
| **platform-console** | 플랫폼 관리자(당신) | 테넌트 생성·정지, 분쟁 대응용 조회, 감사 로그, 플래그. **최고 권한은 서버+RLS+감사로 삼중화.** |
| **consumer-log** | 로그인 사용자 | 주문 **승인 완료** 이벤트 → **자동 타임라인** 기록, 이후 친구·공개 범위·피드는 단계적. |

---

## 6. 보안 아키텍처 (요약)

1. **Supabase Auth**  
   - 소비자 로그/소셜: 일반 사용자 계정.  
   - 점주: `tenant_id` 클레임 또는 멤버 테이블.  
   - 플랫폼: 별도 역할 또는 SSO, **MFA 권장**.

2. **RLS**  
   - 모든 업무 테이블은 **RLS ON**.  
   - `orders`: 소비자는 본인 것만, 점주는 자기 가게만, 플랫폼은 정책에 따라.

3. **서버 전용**  
   - `SUPABASE_SERVICE_ROLE_KEY`는 **배포 환경 변수만**, Next 서버·Edge에서만.  
   - 웹푸시 VAPID **private** 키, 알림 발송, 관리자 전용 작업은 **함수/Route Handler**.

4. **감사**  
   - 플랫폼의 민감 조회·수정은 `audit_logs`에 **누가·언제·무엇을**.

---

## 7. 배리어프리(인증 대비) 프로세스

1. **설계**: 색 대비, 포커스 순서, 스크린리더 레이블, 오류 연결(`aria-describedby`).  
2. **구현**: Radix 패턴 유지, 커스텀 위젯 최소화.  
3. **자동 검사**: CI에 접근성 린트/스캔.  
4. **수동**: 스크린리더·키보드만 시나리오(주문 완료까지).  
5. **인증/적합성**: 목표 기관·기준표(KWCAG 2.1 등)를 **출시 전에 하나로 고정**.

---

## 8. “자동 로그” 데이터 흐름 (4번째 앱)

1. `orders` 상태 전이: `pending` → `approved`(용어는 스키마에서 확정).  
2. 승인 시 **서버**에서 `experience_entries`(가칭) INSERT — **사용자 id + tenant + order 참조 + 타임스탬프**.  
3. consumer-log는 이 테이블을 **타임라인**으로 표시.  
4. 소셜 확장 시 **공개 범위**, **차단·신고**, **삭제권**을 동의·정책과 함께 설계.

---

## 9. 다음에 함께 확정하면 좋은 것

- [ ] 모노레포에서 **앱 4개를 처음부터 전부 열지**, **메뉴+점주만 먼저** 열지.  
- [ ] 소비자 **로그인 시점**: 주문만 할 때는 비회원 허용 여부.  
- [ ] 배포: Vercel / 자체 호스트 / Supabase Hosting 조합.  
- [ ] 기존 Supabase 프로젝트를 **새 마이그레이션으로 갈아탈지**, **새 프로젝트**를 둘지.

---

## 10. 첫 실행 순서 (제안)

1. 루트에 **pnpm + turbo + 공유 tsconfig**만 깔고 빈 앱 1개(예: `consumer-menu`)로 빌드 통과.  
2. `packages/ui`에 버튼·레이아웃·스킨만 넣고 **접근성 패턴 고정**.  
3. Supabase **새 마이그레이션** 초안: `tenants`, `profiles`, `menus`, `orders`, RLS 초안.  
4. 레거시 데이터 **수동 마이그레이션 스크립트**는 필요 시 별도.

이 문서는 **v0.1**이며, 합의 후 버전을 올리며 갱신한다.

---

## 관련 문서

- [QR 접근·테넌트 식별 & 비회원 주문](./QR_AND_GUEST_ORDERS.md)  
- [배리어프리 진행·손님 주문 RPC 적용 순서](./BARRIER_FREE_NEXT_STEPS.md) — 접근성 체크리스트·`supabase/migrations`·앱 스모크·추후 로드맵  
- [스티치 화면 → 라우트·컴포넌트 매핑](./STITCH_TO_APP_MAP.md)  
- [저장소 시작 체크포인트](./REPO_CHECKPOINT.md)  
- [안정성·보안 강화 순서](./HARDENING_ORDER.md)  
- [Vercel 배포](./DEPLOY_VERCEL.md) — §9 한 페이지 운영 순서(Supabase 검증·스모크 포함)
