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

---

## 8. 보안

- Supabase 키 등 민감 값은 **Vercel Environment Variables** 에만 둔다. 저장소에 커밋하지 않는다.
