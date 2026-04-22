# Vercel 자동 배포 (consumer-menu)

`main` 브랜치에서 **CI 워크플로가 성공하면** `.github/workflows/deploy-vercel.yml` 이 `apps/consumer-menu` 를 프로덕션으로 배포한다.

## 1. Vercel에서 프로젝트 만들기

1. [Vercel](https://vercel.com) 대시보드에서 **New Project** → GitHub 저장소 연결.
2. **Root Directory** 를 **`apps/consumer-menu`** 로 설정한다.
3. Install / Build 는 저장소의 `apps/consumer-menu/vercel.json` 과 동일하게 맞춘다 (모노레포 루트에서 `pnpm` + `turbo`).
4. 한 번 배포가 성공하면 아래 ID 를 복사한다.

## 2. GitHub Secrets 설정

저장소 **Settings → Secrets and variables → Actions → New repository secret**

| Secret 이름 | 어디서 찾기 |
|-------------|----------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → **Tokens** → Create |
| `VERCEL_ORG_ID` | 프로젝트 **Settings → General** 의 **Team ID** 또는 `vercel teams ls` 등에서 `team_…` / `user_…` 형태 |
| `VERCEL_PROJECT_ID` | 프로젝트 **Settings → General** 의 **Project ID** (`prj_…`) |

Secrets 가 없으면 배포 워크플로는 **성공으로 건너뛰기만** 하고, 기본 CI 는 그대로 통과한다.

## 3. 로컬에서 확인

```bash
pnpm install
pnpm exec turbo run build --filter=@chaya/consumer-menu
```

## 4. 참고

- 도메인·환경 변수는 Vercel 프로젝트 설정에서 관리한다.
- Supabase 등 **민감 값은 Vercel Environment Variables** 에만 두고, 저장소에는 넣지 않는다.

---

## 5. 문제 해결 (스크린샷에 나온 **`Error` · 1초 실패 · ⚠** 용)

### 두 가지 배포 경로가 있다

| 경로 | 설명 |
|------|------|
| **Vercel ↔ Git 연동** | GitHub 에 `push` 하면 Vercel 이 **저장소를 받아 알아서 빌드**한다. 대시보드 **Deployments** 목록이 여기에 해당한다. |
| **GitHub Actions `deploy-vercel.yml`** | CI 성공 후 CLI 로 `vercel deploy` 한다. Secrets 가 있을 때만 의미 있다. |

지금 Next 앱은 **`apps/consumer-menu`** 안에만 있다. **Root Directory 가 잘못되면** 보통 **몇 초 안에 `Error`** 로 끝난다.

### 반드시 확인할 것 (가장 흔한 원인)

1. Vercel → **chaya-app** (쓰는 프로젝트 하나만 정리하는 것을 권장) → **Settings → General**
2. **Root Directory** → **Edit** → **`apps/consumer-menu`** 로 두고 저장한다.  
   - 비어 있거나 `./` 만 있으면 **저장소 루트**로 빌드하는데, 그곳에는 Next 앱이 없어 실패하기 쉽다.
3. **Settings → Build & Development Settings**
   - **Framework Preset**: Next.js (자동이면 그대로)
   - 대시보드에 **Install / Build Command** 를 수동으로 넣었다면, 저장소의 `apps/consumer-menu/vercel.json` 과 **충돌**할 수 있다. 가능하면 **비우고** `vercel.json` 만 쓰거나, 둘 중 하나만 남긴다.
4. 저장 후 **Deployments** 에서 최신 실패 건을 열고 **Build Logs** 첫 빨간 줄을 본다. (그 한 줄이면 원인 특정이 빠르다.)

### GitHub 커밋 옆 빨간 X (`1/3` 등)

여러 워크플로가 동시에 돈다. **실패한 항목 이름**을 눌러야 한다.

- **`CI`** 가 빨간색이면 → Actions 에서 로그 확인 (코드·워크플로 문제).
- **`Dependabot`** 관련만 빨간색이면 → 자동 버전 올림 PR 이 깨진 것이고, **본인이 올린 `main` 의 CI 와는 별개**일 수 있다.
- **`Deploy Vercel`** 이 빨간색이면 → Secrets·Vercel CLI 쪽.

### 여전히 예전 배포만 `Current` 로 남을 때

Production 이 **오래된 커밋(Merge …)** 에 고정돼 있으면, 위 Root Directory 수정 후 **Redeploy** 하거나 `main` 에 작은 커밋을 다시 푸시하면 된다.
