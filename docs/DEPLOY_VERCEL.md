# Vercel 배포 — `chaya-app.vercel.app` 하나로 통일

손님용 Next 앱 코드는 **이 저장소 안의 `apps/consumer-menu`** 에만 있습니다.  
배포 결과로 쓰실 주소는 **`https://chaya-app.vercel.app/`** 하나로 맞추는 것을 기준으로 설명합니다.

---

## 1. 용어 정리 (헷갈리는 말만)

| 말 | 의미 |
|----|------|
| **모노레포** | Git **한 저장소** 안에 여러 패키지가 있는 구조. 여기서는 루트에 `package.json`이 있고, 앱은 `apps/consumer-menu/` 아래에 있습니다. |
| **저장소 루트** | Git 클론한 맨 위 폴더 (`chaya-app/`). 여기에는 Next가 없고 `turbo`만 있을 수 있습니다. |
| **Root Directory (Vercel)** | “이 Vercel 프로젝트는 저장소의 **어느 폴더를 Next 앱으로 볼 것인가**”입니다. **반드시 `apps/consumer-menu`** 로 둡니다. |
| **Vercel 프로젝트** | 배포·도메인·환경 변수가 묶이는 **배포 단위**입니다. 프로젝트마다 `이름.vercel.app` 기본 주소가 하나씩 생깁니다. **프로젝트를 여러 개 만들면 URL도 여러 개**가 됩니다. |

정리: **모노레포는 그대로 두고**, Vercel에는 **프로젝트를 `chaya-app` 하나만 두고**, 그 프로젝트의 **Root Directory만 `apps/consumer-menu`** 로 맞추면 됩니다.

---

## 2. 권장 구성 (이렇게만 유지)

1. [Vercel](https://vercel.com) 대시보드에서 **프로젝트 이름이 `chaya-app`** 인 것 **하나만** 쓴다.
2. **Settings → Build and Deployment → Root Directory** → **`apps/consumer-menu`** (저장 후 재배포).  
   *(참고: `General` 안에는 없을 수 있습니다. Settings 상단 검색창에 `root` 라고 검색해도 됩니다.)*
3. GitHub 저장소는 **이 `chaya-app` 레포 하나**만 연결한다.
4. **Build & Development Settings**  
   - Install / Build 는 가능하면 **대시보드에 수동 값을 비우고**, 저장소의 `apps/consumer-menu/vercel.json` 에 맡긴다.  
   - 수동으로 넣었다면 `vercel.json` 과 **중복·충돌**이 없는지 확인한다.
5. 도메인은 **`chaya-app.vercel.app`** 만 쓰거나, 커스텀 도메인을 이 프로젝트에만 연결한다.

### 나머지 Vercel 프로젝트는 정리 (대시보드에서)

아래처럼 **이름만 다른 중복 프로젝트**가 있으면 헷갈립니다. **사용하지 않을 프로젝트는 삭제하거나 Git 연결을 끊습니다.**

- `consumer-menu` (`consumer-menu.vercel.app` 등)
- `consumer-barrier-free` (예전에 다른 폴더에서 CLI로 만든 경우)

> 삭제 전에: **환경 변수**(Supabase 등)를 **`chaya-app` 프로젝트**로 옮겨 두었는지 확인하세요.

---

## 3. GitHub Actions 와의 관계

`main` 브랜치에서 CI가 성공하면 `.github/workflows/deploy-vercel.yml` 이 **같은 코드**를 다시 프로덕션에 올릴 수 있습니다.  
이때 **`VERCEL_PROJECT_ID` 는 반드시 “chaya-app” 프로젝트의 ID**여야 합니다. (`consumer-menu` 프로젝트 ID를 넣으면 그쪽으로 배포됩니다.)

저장소 **Settings → Secrets → Actions**

| Secret | 설명 |
|--------|------|
| `VERCEL_TOKEN` | Vercel → Account Settings → **Tokens** |
| `VERCEL_ORG_ID` | 팀/계정 ID (`team_…` / `user_…`) |
| `VERCEL_PROJECT_ID` | **`chaya-app` 프로젝트** → Settings → General → **Project ID** (`prj_…`) |

Secrets 가 없으면 워크플로는 **건너뛰기만** 하고, **Vercel Git 연동만으로도** 배포될 수 있습니다.

---

## 4. 로컬에서 빌드 확인

```bash
pnpm install
pnpm exec turbo run build --filter=@chaya/consumer-menu
```

**Turborepo / Vercel:** Production·Preview에서 설정한 환경 변수 이름은 `apps/consumer-menu/turbo.json` 의 `tasks.build.env` 에 **이름만** 선언해 두었습니다. 값은 계속 Vercel 대시보드(또는 CLI)에서만 주입하고, Turborepo가 캐시 키를 올바르게 잡도록 합니다. 자세한 변수 목록은 같은 앱의 `.env.example` 을 참고하세요.

**Supabase Auth URL:** 대시보드 **Authentication → URL configuration**(Site URL·Redirect URLs)을 프로덕션/프리뷰 호스트와 맞추는 절차는 `docs/MERCHANT_MIGRATION_RUNBOOK.md` §5 및 `docs/RUNTIME_GO_LIVE_CHECKLIST.md` 2단계를 따릅니다(비밀 값은 저장소에 두지 않음).

**프리뷰 배포:** PR 프리뷰 URL이 **보호(Vercel SSO·암호)**되어 있으면 CLI·스크립트 스모크는 건너뛰어도 됩니다. 프로덕션 URL로만 주기 점검해도 됩니다.

---

## 5. 로컬 CLI 배포 (선택)

**항상 Vercel 프로젝트 `chaya-app`에만** 링크하세요. 다른 이름으로 `vercel link` 하면 프로젝트가 또 생길 수 있습니다.

모노레포에서 Dashboard **Root Directory**가 `apps/consumer-menu`이면, **`apps/consumer-menu` 안에서만** `vercel deploy` 할 때 **`…/apps/consumer-menu/apps/consumer-menu`** 처럼 경로가 겹치는 오류가 날 수 있습니다. 이때는 **저장소 루트**에서 링크·배포합니다.

```bash
cd …/chaya-app
npx vercel link --yes --scope <팀 또는 조직 슬러그> --project chaya-app
npx vercel deploy --prod --yes
```

루트만 쓸 때는 `apps/consumer-menu/.vercel` 폴더가 남아 있으면 헷갈리므로 **삭제**해 두어도 됩니다.

---

## 6. 문제 해결 요약

| 증상 | 할 일 |
|------|--------|
| 빌드 로그에 Next.js 가 없다 | Root Directory 가 **`apps/consumer-menu`** 인지 확인 |
| URL이 여러 개 | 쓰지 않는 **Vercel 프로젝트 삭제**, GitHub Secrets 의 **Project ID** 재확인 |
| 배포는 되는데 예전 코드 | Production **Redeploy** 또는 `main` 재푸시 |

---

## 7. 헬스 체크 (`/health`)

배포 후 `https://chaya-app.vercel.app/health` (또는 본인 도메인 + `/health`)를 열면 JSON으로 **`supabase.configured`** 등이 옵니다.  
**URL·anon 키 값은 응답에 넣지 않으며**, Vercel에 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 **설정돼 있는지 여부**만 확인할 때 쓰면 됩니다.  
Vercel 프로덕션/프리뷰에서는 빌드 시 주입되는 **`deployment.env`**, **`deployment.gitCommitSha`**(짧은 검증용으로 `main` 마지막 커밋과 대조 가능)가 붙을 수 있습니다. 로컬 `next dev` 에서는 보통 생략됩니다.

**Ops 참고(RSC·미들웨어·쿠키):** 서버·미들웨어는 요청마다 Supabase 세션 쿠키를 읽고 갱신합니다. **GET `/m/logout`은 405**로 두어 프리페치·크롤러가 세션을 지우지 않게 했고, 실제 로그아웃은 **POST 폼**만 사용합니다.

손님 주문·화면 동선은 반드시 브라우저로 한 번 확인하세요. 순서는 **`docs/BARRIER_FREE_NEXT_STEPS.md`** 의 「배포 후 앱 스모크 (손님 주문)」를 따르면 됩니다.
자동 1차 점검은 저장소 루트에서 `pnpm smoke:consumer -- --expected-sha <커밋SHA앞부분> --tenant <slug>` 로 실행할 수 있습니다.  
`--expected-sha` 가 있으면 기본값으로 **프로덕션에 새 커밋이 반영될 때까지** `/health`의 `deployment.gitCommitSha` 를 **최대 8회**(간격 기본 **12초**) 재확인합니다. 필요 시 `--sha-retries` / `--sha-retry-delay-ms` 로 조정합니다.  
점검 항목에 **`/t/{tenant}/orders`(주문 허브)**·**`/t/{tenant}/cart`(주문 확인)**·**`/t/{tenant}/barrier-free`(목록형 메뉴)** SSR 마커, **`GET …/checkout/payment`·`GET …/staff-call` → 405**(GET 부작용 없음) 포함.

GitHub에서 **`Smoke consumer`** 워크플로(`.github/workflows/smoke-consumer.yml`)가 **매일 한 번**, **main에서 CI 성공 후**, **수동(workflow_dispatch)** 에 프로덕션 URL 스모크를 돌립니다(PR 브랜치 CI에는 반응하지 않음 — `workflow_run` + `head_branch == main`).  
`workflow_run`(main 성공 분기)에서는 **해당 CI 커밋 SHA** 로 `--expected-sha` 를 넘겨 배포 반영까지 자동 재시도합니다.

---

## 8. 보안

- Supabase 키 등 민감 값은 **Vercel Environment Variables** 에만 둔다. 저장소에 커밋하지 않는다.

---

## 9. 한 번에 도는 운영 순서 (소비자/점주 안정성 기준)

1. **`main`** 반영 후 Vercel 프로덕션(또는 `npx vercel deploy --prod`)이 끝날 때까지 기다린다.  
2. **`GET …/health`** — `supabase.configured`, `deployment.gitCommitSha` 가 기대 커밋인지 확인.  
3. **소비자 스모크**: `pnpm smoke:consumer` 또는 `pnpm smoke:consumer -- --expected-sha <커밋접두> --tenant <slug>` (메뉴판·주문 허브·장바구니·편한 메뉴·결제/직원호출 GET 405 포함).  
4. **점주 병행 스모크**: `pnpm smoke:merchant -- --tenant <slug>` (Green `/m/{tenant}/orders`,`/menus` + Blue 데모 URL 가용성).  
5. **통합 안정성 게이트**: `pnpm smoke:platform -- --tenant <slug> --expected-sha <커밋접두>` (소비자+점주 연속 점검).  
6. **Supabase**: 신규/스테이징 DB면 `verify_guest_order_rpcs.sql` 로 ①~⑤ 확인(`docs/BARRIER_FREE_NEXT_STEPS.md` 참고).  
7. **브라우저**: 같은 문서의 「배포 후 앱 스모크」(주문 한 번·목록·시크릿 창 등) 선택 실행.
8. **Lighthouse(모바일)**: CI 자동화는 필수 아님. 수동으로 한 번 **베이스라인**만 잡아 두면 이후 성능·접근성 회귀 비교에 도움이 됩니다.

추가로 운영 리포트까지 한 번에 만들려면:

```bash
pnpm stability:cycle -- --tenant <slug> --checklist-file docs/merchant-validation-<slug>-<yyyymmdd>.md --out-file docs/STABILITY_REPORT.md
```
