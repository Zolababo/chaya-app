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

- 루트 **`pnpm install`** 이 성공해야 모노레포 스크립트가 동작한다 (`package.json` 의 `packageManager` 버전 참고).

---

## 5. 다음 개발 순서 (요약)

1. `pnpm install`
2. `apps/consumer-menu` 에 **Next.js 등** 스캐폴드
3. `docs/STITCH_TO_APP_MAP.md` 기준 라우트 뼈대
4. Supabase 연동은 **RLS 초안 이후**

---

## 관련 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [QR_AND_GUEST_ORDERS.md](./QR_AND_GUEST_ORDERS.md)
