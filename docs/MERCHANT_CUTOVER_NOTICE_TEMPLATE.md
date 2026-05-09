# Merchant Cutover Notice Template

## 1) 점주 공지 (전환 D-1)

안녕하세요. CHAYA 점주 화면 접속 주소가 아래처럼 통합됩니다.

- 기존(데모): `https://chaya-menu-test.vercel.app/`
- 신규(운영): `https://chaya-app.vercel.app/m/{tenant}/orders`

전환 시점 이후에는 신규 주소를 기본으로 사용해 주세요.  
문제가 생기면 즉시 아래 연락처로 알려주세요.

- 운영 연락처:
- 대응 가능 시간:

## 2) 전환 당일 공지

지금부터 점주 화면은 신규 주소(`/m/*`)를 기본으로 운영합니다.

- 주문 큐: `https://chaya-app.vercel.app/m/{tenant}/orders`
- 메뉴 관리: `https://chaya-app.vercel.app/m/{tenant}/menus`

초기 1주 동안은 fallback으로 기존 데모 링크도 유지합니다.

## 3) read-only 전환 공지 (데모 종료 전)

기존 데모 점주앱은 read-only 상태로 전환됩니다.  
실제 운영 작업(주문 상태 변경/메뉴 수정)은 신규 주소에서만 진행해 주세요.

종료 예정일:
