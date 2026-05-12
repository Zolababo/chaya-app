# 현장 온보딩: 운영자가 매장을 바로 열 때 (전체 그림)

CHAYA는 **가게(테넌트) 전용 DB 테이블**이 없고, **`tenant_slug` 문자열**이 곧 매장 식별자입니다. 손님·점주 URL이 이 문자열을 공유합니다.

## 한 장 요약

| 단계 | 누가 | 무엇을 | 결과 |
|------|------|--------|------|
| 1 | 운영자 (`/ops` 로그인) | `/ops/merchants` 에서 **슬러그 + 점주 계정** 생성 | `merchant_tenant_members` 행 + Auth 사용자 |
| 2 | 점주 | `/m/login` → 해당 가게 선택 | 대시보드·주문·메뉴( owner ) 접근 |
| 3 | 점주 (owner) | **메뉴 관리**에서 메뉴 등록 | `ChayaMenus.tenant_slug` 에 메뉴 저장 |
| 4 | 손님 | `/t/{슬러그}` | 메뉴판·주문 |

**즉:** “매장 추가” = 운영자 화면에서 **이미 가능**합니다. 별도 등록 마법사는 없고, **슬러그를 정하는 것**이 곧 매장 주소를 여는 일입니다.

## 흐름도 (mermaid)

```mermaid
flowchart LR
  subgraph ops [운영자 /ops]
    A["/ops/merchants\n슬러그 + 초대"]
  end
  subgraph db [Supabase]
    M[merchant_tenant_members]
    U[auth.users]
    C[ChayaMenus]
  end
  subgraph merchant [점주 /m]
    L[/m/login]
    D[/m/slug/dashboard]
    Men[/m/slug/menus]
  end
  subgraph guest [손님 /t]
    T[/t/slug]
  end
  A --> U
  A --> M
  L --> M
  Men --> C
  T --> C
```

## 슬러그 규칙 (앱이 정규화)

- 영문 **소문자**, **숫자**, **하이픈**만 남깁니다.
- 공백은 하이픈으로 바뀝니다.
- 길이 **2~120**자. 한글만 넣으면 글자가 사라져 **오류**가 날 수 있으니, 현장에서는 **로마자 슬러그**를 쓰는 것을 권장합니다.

## 운영자가 점주에게 전달할 것 (체크리스트)

1. **손님 메뉴판 URL** — `https://{배포주소}/t/{슬러그}` (또는 QR로 동일 경로)  
2. **점주 로그인** — `/m/login` + 방금 만든 이메일(또는 SMS)·임시 비밀번호  
3. **다음 할 일** — 로그인 후 **메뉴 관리**에서 메뉴 입력 (없으면 손님 화면이 비어 있음)

`NEXT_PUBLIC_SITE_URL` 이 Vercel 등에 설정되어 있으면, 초대 직후 `/ops/merchants` 성공 메시지에 **전체 URL 링크**가 표시됩니다.

## 아직 “자동”이 아닌 부분 (로드맵 후보)

- **메뉴 템플릿 복사** (기존 가게에서 신규 슬러그로 일괄 복제) — 운영 스크립트 또는 `/ops` 기능으로 확장 가능  
- **`tenants` 표시명 테이블** (슬러그와 별도의 한글 가게명) — 리포트·영수증용으로 나중에 추가 가능  
- **셀프 서비스 가입** (점주가 스스로 slug 잡기) — 정책·남용 방지 설계 후

현 단계에서 **설득 현장**에 맞추려면, 위 체크리스트 + `docs/MERCHANT_LIVE_EXECUTION_PLAN.md` 의 리허설 항목을 같이 쓰면 됩니다.
