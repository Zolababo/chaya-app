# 점주 더보기(☰) 설정

**프로덕션:** https://chaya-app.vercel.app

## 진입 (전체 페이지 — 모달 없음)

- 헤더 **☰** → `/m/{tenant}/more` (설정 허브)
- 하위 메뉴는 모두 **일반 페이지**로 이동 (동일 회색 배경·흰 카드 UI)

## 기능 맵

| 허브 항목 | 경로 |
|-----------|------|
| 매장 정보 | `/more/store` |
| 영업 설정 | `/more/hours` (브레이크 **사용 토글** 후 시간) |
| 테이블 QR | `/tables` |
| 직원 관리 | `/more/staff` (1계정·다기기 — `MERCHANT_ACCOUNT_POLICY.md`) |
| 알림 · 카카오 | `/more/notifications` |
| 정산 · 매출 | `/more/export` |
| 비밀번호 · 계정 | `/more/account` |
| 앱 버전 · 고객센터 | `/more/about` |

## QA

- [ ] ☰ → `/more` 전체 페이지 (바텀시트 아님)
- [ ] 서브페이지 ← 더보기 복귀
- [ ] 영업 — 브레이크 꺼짐/켜짐 토글 후 시간 저장
- [ ] 로고 URL · 갤러리 · 제거(이니셜)
