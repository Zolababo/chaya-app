# 저장소 시작 체크포인트

새 기능을 붙이기 전에 확인하면 좋은 목록이다.

---

## 1. 폴더 역할 (현재 기준)

| 경로 | 역할 |
|------|------|
| `apps/` | 새 앱 (예: `consumer-menu`부터 스캐폴드) |
| `packages/` | 공유 설정·UI·DB 클라이언트 등 |
| `docs/` | 아키텍처·QR·스티치 매핑 등 설계 문서 |
| `supabase/` | 마이그레이션·Edge Functions |
| `legacy/` | 예전 단일 HTML 프로토타입 (**참고만**, 새 코드 아님) |
| `public/` | 공용 정적 파일 (있을 경우) |

레거시 HTML은 **`legacy/admin-app`**, **`legacy/consumer-app`** 아래로 옮겼다. 새 작업 경로와 혼동하지 않도록 한다.

---

## 2. Git·동기화

- 브랜치가 **`main`**이면, 큰 변경 전 **`git status`**로 수정·삭제·추적 안 된 파일을 확인한다.
- 원격과 맞추려면 **`git fetch` / `git pull`** 후 작업한다.
- 큰 리팩터 전 한 번 **`backup/` 브랜치** 또는 **태그**를 만들어 두면 안전하다.

---

## 3. 비밀·키

- 예전 HTML 안에 있던 **Supabase anon 키 등**은 이미 노출된 적이 있다면 Supabase 대시보드에서 **키 회전(rotate)** 을 검토한다.
- **서비스 롤 키**, **웹푸시 개인키** 등은 저장소에 넣지 않고 **환경 변수 + 서버에서만** 사용한다.
- 루트 `.gitignore`에 **` .env`** 가 포함되어 있는지 확인하고, 필요한 변수명만 **`.env.example`** 에 적는다.

---

## 4. 도구

- **Node.js 20.9+** (루트 `package.json` 의 `engines` 참고).
- **pnpm 9** — `packageManager` 필드와 맞춘다. (로컬에 pnpm이 없으면 `corepack enable` 후 `corepack prepare pnpm@9.15.0 --activate` 또는 `npx pnpm@9.15.0 install` 도 가능하다.)
- 루트에서 **`pnpm install` → `pnpm run build` → `pnpm run lint`** 가 모두 통과하면, 엔지니어링 “기본 안정성”은 확보된 것으로 본다.
- `apps/consumer-menu/.env.local` 은 Supabase에 붙일 때만 생성하고, **이름만** `apps/consumer-menu/.env.example` 에 둔다.

---

## 5. CI (GitHub)

- **`.github/workflows/ci.yml`** — `main` push/PR 시 `pnpm install --frozen-lockfile`, `verify`, 정보성 `pnpm audit` 를 실행한다. `pnpm-lock.yaml` 은 항상 커밋해 lockfile이 흐트러지지 않게 한다.
- **`.github/workflows/deploy-vercel.yml`** — `main` 에서 CI 성공 후 `apps/consumer-menu` 를 Vercel 프로덕션 배포. Secrets 설정은 [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md).
- **`.github/dependabot.yml`** — 루트 npm/pnpm 의존성 주간 PR.

---

## 6. 다음 개발 순서 (요약)

1. (완료) 루트 `pnpm` 워크스페이스, `apps/consumer-menu` — Next.js 15, `build`/`lint`·보안 HTTP 헤더
2. (완료) `docs/STITCH_TO_APP_MAP.md` 기준 **라우트** — `/t/[tenant]`, `/t/[tenant]/menu/[itemId]`, `/t/[tenant]/cart`, `/t/[tenant]/orders/[orderId]`, 공통 `SessionHeader`·`BottomNav` (UI는 플레이스홀더, 루트 `/`는 `/t/demo` 리다이렉트)
3. Supabase 연동은 **RLS 초안 이후** (서비스 롤 키는 서버·엣지에서만)
4. **점주 `/m/...`**: 코드가 있어도 **대외 “오늘부터 쓰세요” 소개 단계**와는 별개다. 점주 설득·실사용에 필요한 최소 기준은 [ARCHITECTURE.md](./ARCHITECTURE.md) **§5.1 「점주 기능…」** 절을 채울 때까지 내부 프리뷰로 두는 것을 권장한다.

---

## 관련 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [QR_AND_GUEST_ORDERS.md](./QR_AND_GUEST_ORDERS.md)
- [안정성·보안 강화 순서](./HARDENING_ORDER.md)
