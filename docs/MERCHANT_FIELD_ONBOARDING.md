# 현장 온보딩: 운영자가 매장을 바로 열 때 (전체 그림)

CHAYA는 **가게(테넌트) 전용 DB 테이블**이 없고, **`tenant_slug` 문자열**이 곧 매장 식별자입니다. 손님·점주 URL이 이 문자열을 공유합니다.

**배포 순서:** Supabase에 `20260512120000_merchant_tenant_members_approved_at.sql` 을 적용한 뒤, 이 승인 로직이 포함된 앱을 배포하세요. (컬럼 없이 새 앱만 올리면 API 조회가 실패할 수 있습니다.)

## 한 장 요약

| 단계 | 누가 | 무엇을 | 결과 |
|------|------|--------|------|
| 1a | 운영자 (`/ops` 로그인) | `/ops/merchants` 에서 **슬러그 + 점주 계정** 생성 | `merchant_tenant_members` 행 + Auth 사용자 |
| 1b | 운영자 | 목록에서 **「승인」** (또는 초대 시 **「초대 직시 접속 허용」** 체크) | `approved_at` 이 채워지면 점주앱 `/m/{slug}/*` 접근 허용 |
| 2 | 점주 | `/m/login` → 가게 선택 | 승인된 가게만 대시보드로 진입 |
| 3 | 점주 (owner) | **메뉴 관리**에서 메뉴 등록 | `ChayaMenus.tenant_slug` 에 메뉴 저장 |
| 4 | 손님 | `/t/{슬러그}` | 메뉴판·주문 |

**즉:** “매장 추가” = 운영자 화면에서 **슬러그 + 초대**로 끝내고, **승인 한 번**으로 점주앱을 열어 줍니다. 별도 매장 등록 마법사는 없습니다.

## 흐름도 (mermaid)

```mermaid
flowchart LR
  subgraph ops [운영자 /ops]
    A["/ops/merchants\n슬러그 + 초대"]
    Ap["목록에서 승인\napproved_at"]
  end
  subgraph db [Supabase]
    M[merchant_tenant_members\napproved_at]
    U[auth.users]
    C[ChayaMenus]
  end
  subgraph merchant [점주 /m]
    L[/m/login]
    P[/m/access-pending\n승인 대기 안내]
    D[/m/slug/dashboard]
    Men[/m/slug/menus]
  end
  subgraph guest [손님 /t]
    T[/t/slug]
  end
  A --> U
  A --> M
  Ap --> M
  L --> M
  M -->|approved_at NULL| P
  M -->|approved_at set| D
  Men --> C
  T --> C
```

## 승인 정책 (앱 동작)

- **기본:** 신규 초대 행은 `approved_at` 이 비어 있으면 점주는 `/m/{tenant}/dashboard` 등 테넌트 라우트에 **들어갈 수 없습니다.** 안내는 `/m/access-pending` 입니다.
- **현장에서 바로 열기:** 운영자가 같은 화면 목록에서 해당 행 **「승인」** 을 누르면 즉시 접근 가능해집니다.
- **테스트·내부용:** 초대 폼에서 **「초대 직시 접속 허용」** 을 켜면 승인 단계를 생략합니다.
- **기존 데이터:** 마이그레이션 시점에 이미 있던 멤버십 행은 `approved_at = created_at` 으로 소급 채워 **이전과 동일하게** 동작합니다.

## 슬러그 규칙 (앱이 정규화)

- 영문 **소문자**, **숫자**, **하이픈**만 남깁니다.
- 공백은 하이픈으로 바뀝니다.
- 길이 **2~120**자. 한글만 넣으면 글자가 사라져 **오류**가 날 수 있으니, 현장에서는 **로마자 슬러그**를 쓰는 것을 권장합니다.

## 운영자가 점주에게 전달할 것 (체크리스트)

1. **손님 메뉴판 URL** — `https://{배포주소}/t/{슬러그}` (또는 QR로 동일 경로)  
2. **점주 로그인** — `/m/login` + 방금 만든 이메일(또는 SMS)·임시 비밀번호  
3. **승인** — 운영자가 `/ops/merchants` 에서 「승인」을 누른 뒤 점주에게 “다시 들어가 보세요” 안내 (또는 초대 시 즉시 허용 체크)  
4. **다음 할 일** — 로그인 후 **메뉴 관리**에서 메뉴 입력 (없으면 손님 화면이 비어 있음)

`NEXT_PUBLIC_SITE_URL` 이 Vercel 등에 설정되어 있으면, 초대 직후 `/ops/merchants` 성공 메시지에 **전체 URL 링크**가 표시됩니다.

## 아직 “자동”이 아닌 부분 (로드맵 후보)

- **메뉴 템플릿 복사** (기존 가게에서 신규 슬러그로 일괄 복제) — 운영 스크립트 또는 `/ops` 기능으로 확장 가능  
- **`tenants` 표시명 테이블** (슬러그와 별도의 한글 가게명) — 리포트·영수증용으로 나중에 추가 가능  
- **셀프 서비스 가입** (점주가 스스로 slug 잡기) — 정책·남용 방지 설계 후

현 단계에서 **설득 현장**에 맞추려면, 위 체크리스트 + `docs/MERCHANT_LIVE_EXECUTION_PLAN.md` 의 리허설 항목을 같이 쓰면 됩니다.
