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
