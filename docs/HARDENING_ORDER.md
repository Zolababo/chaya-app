# 안정성·보안 강화 순서 (영향 작은 것 → 큰 것)

배포·운영 리스크를 최소화하려면 **아래 순서**를 권장한다. 앞쪽은 되돌리기 쉽고, 뒤로 갈수록 테스트·모니터링이 필요하다.

---

## 1단계 — 저장소·런타임 표면 (동작 거의 동일)

**현재 저장소에 반영된 것:** `.editorconfig`, Next `poweredByHeader: false`, `reactStrictMode: true`, 루트 `pnpm run verify`.

| 항목 | 효과 |
|------|------|
| `.editorconfig`, 일관된 줄바꿈 | Git diff 안정, 협업 시 실수 감소 |
| Next `poweredByHeader: false` | `X-Powered-By` 제거로 스택 노출 완화 |
| `reactStrictMode` 명시 | 개발 중 부작용 조기 발견 (프로덕션 번들 크기 변화 없음) |
| 루트 `pnpm run verify` (`lint` + `build`) | 배포 전 동일 검증 |

---

## 2단계 — 의존성·CI

**현재 저장소에 반영된 것:** Dependabot(주간), CI에서 정보성 `pnpm audit` (`continue-on-error`), `pnpm run audit` 스크립트, `main`에서 CI 성공 후 Vercel 배포 워크플로( Secrets 없으면 건너뜀 — `docs/DEPLOY_VERCEL.md`).

| 항목 | 효과 |
|------|------|
| `pnpm audit` 주기 실행, 심각도 높은 것만 업데이트 | 알려진 취약점 완화 |
| Lockfile 커밋 유지, CI `--frozen-lockfile` | 재현 가능한 빌드 |

---

## 3단계 — 설정·헤더 (점진적)

| 항목 | 주의 |
|------|------|
| `Strict-Transport-Security` | **HTTPS 확실한 환경에서만** |
| `Content-Security-Policy-Report-Only` | 먼저 리포트만 보고, 깨지면 조정 후 본 CSP |
| 환경 변수 스키마 검증 (`zod` 등) | 잘못된 배포 조기 실패 |

---

## 4단계 — 데이터·권한 (영향 큼)

| 항목 | 내용 |
|------|------|
| Supabase **RLS**, 역할별 정책 | 필수 수준으로 설계 후 적용 |
| 서비스 롤 키는 **서버·Edge만** | 클라이언트 번들 금지 |
| 감사 로그(플랫폼 관리자 조회 등) | 신뢰·분쟁 대응 |
| 손님 **주문 상태·상세** RPC 세션 검증 | 적용 내역·쿠키 동기화·남은 경계는 `docs/BARRIER_FREE_NEXT_STEPS.md` 의 Supabase·보안 경계 절 참고 |
| Supabase **일시 오류 재시도** (앱 측) | `apps/consumer-menu/lib/supabase/transient-retry.ts` — 네트워크·연결·게이트웨이(5xx 문자열)·SQL class `08`(연결)·일부 과부하는 **읽기(RPC/select)부터** 짧게 재시도. **주문 INSERT** 는 이중 접수 방지를 위해 운송/연결 계열만 재시도. |

---

## 5단계 — 고급

- Rate limiting, 봇 완화, WAF
- 침투 테스트·배리어프리 인증 심사 대비 체크리스트

이 문서는 합의에 따라 순서를 바꿀 수 있다. **지금 적용 중인 것**은 1단계 중심이다.

---

## 권장(선택) — 오류·성능 모니터링

프로덕션에서는 **Sentry 등 오류 수집**(릴리즈·환경 태그, 소스맵 업로드)을 연결하는 것을 권장합니다. PII·쿠키는 샘플링·스크럽 정책에 맞게 제외하세요. 배포·ENV 절차는 `docs/DEPLOY_VERCEL.md` 를 따릅니다.
