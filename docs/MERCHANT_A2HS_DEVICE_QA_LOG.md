# Merchant A2HS Device QA Log

점주 홈화면 바로가기(Android Chrome) 최종 검증 기록용 템플릿입니다.

**배포 직후(운영):** 프로덕션에서 로그아웃(POST `/m/logout`) 실행 → `/m/login` 으로 돌아온 뒤, 홈 화면 아이콘을 탭했을 때 로그인 폼이 보이는지 한 번 확인합니다.

**다매장 심화(동시 다수 tenant QA):** 별도 일정으로 연기(**deferred**). 아래 시나리오 5는 필요 시만 기록합니다.

## 기본 정보

- 검증일:
- 검증자:
- 기기/OS:
- Chrome 버전:
- 배포 URL:
- 커밋 SHA:

## 사전 확인

- [ ] `https://<배포도메인>/m/login/homescreen-manifest` 응답 200
- [ ] JSON `start_url` 이 `/m/login`
- [ ] 기존 CHAYA 홈화면 아이콘 삭제
- [ ] 승인 정책: `merchant_tenant_members.approved_at` 가 비어 있으면 `/m/access-pending`(마이그레이션 `20260512120000_merchant_tenant_members_approved_at.sql` 적용 전제)

## 시나리오 결과

### 1) 재설치 직후 진입
- 절차: Chrome에서 `/m/login` 열기 -> 홈 화면 추가 -> 아이콘 탭
- 기대: `/m/login` 또는 세션이 있으면 `/m`(단일 가게면 대시보드)
- 결과: PASS
- 메모: (사용자 보고·현장 기록)

### 2) 자동 로그인(세션 유지)
- 절차: 점주 로그인 완료 후 아이콘 탭
- 기대: 로그인 폼 스킵, 점주 화면으로 이동
- 결과: PASS
- 메모: (사용자 보고·현장 기록)

### 3) 강제 로그인 폼
- 절차: `/m/login?reauth=1` 접속
- 기대: 자동 이동 없이 로그인 폼 표시
- 결과: PASS
- 메모: (사용자 보고·현장 기록)

### 4) 로그아웃 후 진입
- 절차: `/m/logout` 실행 후 아이콘 탭
- 기대: 로그인 폼 표시
- 결과: PASS
- 메모: (사용자 보고·현장 기록)

### 5) 다매장 계정
- 절차: 승인된 tenant 2개 이상 계정으로 로그인 후 아이콘 탭
- 기대: `/m` 가게 선택 화면 노출
- 결과: DEFERRED (multi-tenant 심화 QA는 후속)
- 메모:

## 이슈/후속 조치

- 이슈 1:
- 이슈 2:
- 담당/ETA:
