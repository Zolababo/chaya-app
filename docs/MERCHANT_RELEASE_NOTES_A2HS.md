# 점주 A2HS·안정성 릴리스 요약 (한 페이지)

통합 앱(`chaya-app`) 점주 경로(`/m/*`) 기준으로, 홈 화면 추가·세션·배포 점검에 영향 있는 변경을 한곳에 모았습니다.

## 이번에 반영된 동작·문서

1. **홈 화면 manifest** — `/m/login/homescreen-manifest` 의 `start_url` 은 `/m/login` 고정. 루트 `/` 는 손님 데모(`/t/demo`)로 바로 이동. 역할 선택은 `/start` 또는 `CHAYA_ROOT_ROLE_PICKER=1`.
2. **세션 스킵** — 유효 세션이 있으면 `/m/login` 에서 자동으로 점주 화면으로 이동(단일 테넌트 등 기존 로직).
3. **`reauth=1`** — `?reauth=1` 로 자동 이동을 끄고 로그인 폼만 보이게 함. 운영·현장 안내: `docs/MERCHANT_MIGRATION_RUNBOOK.md`, `docs/MERCHANT_FIELD_ONBOARDING.md`.
4. **로그아웃 → `/m/login`** — POST `/m/logout` 후 로그인 URL로 리다이렉트. GET 은 **405**(세션 변경 없음). `docs/MERCHANT_A2HS_DEVICE_QA_LOG.md` 배포 직후 점검 줄 참고.
5. **Turbo / Vercel 빌드 캐시** — `apps/consumer-menu/turbo.json` 의 `tasks.build.env` 에 빌드·런타임에서 읽는 환경 변수 **이름**을 선언. 값은 Vercel 대시보드만 사용. `.env.example` 과 교차 확인 절차는 `docs/DEPLOY_VERCEL.md`.
6. **배포 검증** — `/health` 스모크: `pnpm smoke:consumer` 또는 `node scripts/smoke-consumer-menu.mjs`. 상세 순서는 `docs/DEPLOY_VERCEL.md` §7·§9.

## 관련 문서

- 현장 온보딩: `docs/MERCHANT_FIELD_ONBOARDING.md`
- 병행·컷오버: `docs/MERCHANT_MIGRATION_RUNBOOK.md`
- 디바이스 QA 템플릿: `docs/MERCHANT_A2HS_DEVICE_QA_LOG.md`
