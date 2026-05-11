# 처음부터 끝까지: 배포 후 꼭 맞추는 것들 (비개발자용 가이드)

이 문서는 **“한 문장 요약이 무슨 뜻이었는지”**를 풀어 쓴 것입니다.

---

## 한 줄로 무엇을 하는 건가요?

웹 주소 하나(예: `https://여러분-app.vercel.app`)로 **세 가지 화면**이 함께 돌아갑니다.

| 화면 | 주소 예시 | 누가 씀 |
|------|-----------|---------|
| **손님**(메뉴·주문) | `/t/demo` 같은 형태 | 손님 |
| **점주**(주문 처리·메뉴 수정) | `/m/login` → 가게 선택 | 가게 주인·직원 |
| **운영**(점주 계정 만들기 등) | `/ops/login` | 본사·운영자만 |

코드에서 **이미 만들어 두었습니다.**  
운영에서 해야 하는 일은 크게 세 가지뿐입니다.

1. **Vercel**에 “열쇠 문자열”(환경 변수) 넣기  
2. **Supabase**에 “표 두 개 만들기”(마이그레이션으로 SQL 실행)  
3. **처음 로그인할 운영자 한 명**을 DB에 등록하기  

이걸 했으면 **같은 주소를 휴대폰 브라우저로 열어도** 세 화면이 동작해야 합니다.

---

## 준비물

- **Supabase** 프로젝트 하나(이미 있으면 그걸로 진행)  
- **Vercel**에 이 앱이 연결되어 있고, GitHub에 푸시하면 자동 배포되는 상태  
- Supabase에서 **Project Settings → API** 를 열 수 있어야 합니다.

---

## 1단계: Vercel에 환경 변수 넣기

**의미:** 앱이 Supabase에 안전하게 붙으려면 “주소”와 “열쇠”가 필요합니다. 이걸 Vercel에 저장해 둡니다.

1. [Vercel](https://vercel.com) → 본인 프로젝트 선택  
2. **Settings** → **Environment Variables**  
3. 아래 네 가지를 **Production**(필요하면 Preview도)에 넣습니다.  
   값은 전부 **Supabase 대시보드**에서 복사합니다.

| 이름 (Key) | 어디서 복사? | 비고 |
|------------|--------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → **Project Settings** → **API** → **Project URL** | 그대로 붙여넣기 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 같은 화면의 **anon public** 키 | “공개용”이라 브라우저에 나가도 되는 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 같은 화면의 **service_role** 키 | **절대 깃허브·채팅에 올리지 마세요.** 서버에서만 씀 |
| `NEXT_PUBLIC_SITE_URL` | Vercel이 준 주소 그대로 | 예: `https://여러분-app.vercel.app` (끝에 `/` 없이) |

4. 저장 후 **Deployments**에서 맨 위 배포의 **⋯** → **Redeploy** 로 **한 번 다시 배포**합니다.  
   (안 하면 예전 설정으로 돌아갈 수 있습니다.)

**손님만 쓸 거면 anon 두 개만으로도 목록은 보일 수 있지만**, 점주·운영 기능(주문 DB, 메뉴 수정, 점주 계정 만들기)은 **`SUPABASE_SERVICE_ROLE_KEY` 없으면 거의 안 돌아갑니다.**

---

## 2단계: Supabase 로그인 + Site URL

**운영 `/ops` 로그인:** 이메일+비밀번호(기존 방식).

**점주 `/m` 로그인·초대(두 가지 모드):**

- **기본(테스트·SMS 없이):** Vercel에 **`NEXT_PUBLIC_MERCHANT_LOGIN_SMS` 를 넣지 않거나 `false`** 로 두면, 점주는 **이메일·비밀번호**로 `/m/login` 에 들어옵니다. `/ops/merchants` 에서도 **이메일 + 임시 비밀번호**로 초대합니다. 이때 Supabase **Email** 제공자만 켜져 있으면 됩니다.
- **문자(SMS) 로 전환할 때만:** **`NEXT_PUBLIC_MERCHANT_LOGIN_SMS=true`** 로 배포하면 점주는 **OTP 문자** 로그인하고, `/ops/merchants` 는 **휴대폰 번호** 초대 폼만 씁니다. 다음이 필요합니다.
  1. Supabase → **Authentication** → **Providers** → **Phone** **Enabled**, **Twilio**(또는 허용 SMS 공급자) 연결.
  2. **점주는 “초대된 번호만”** 로그인합니다. 앱에서는 `signInWithOtp(..., shouldCreateUser: false)` 를 쓰므로, 이미 생성된 Auth 사용자에게만 문자가 갑니다.
3. 모든 모드 공통: **Authentication** → **URL configuration** → **Site URL** 을 배포 호스트와 맞춥니다 (예: `https://여러분-app.vercel.app`).

**DB(초대 표시용 컬럼):** `merchant_tenant_members.invite_email` 은 `20260511133000_merchant_tenant_invite_email.sql`, SMS 모드용 `invite_phone` 은 `20260511120000_merchant_tenant_invite_phone.sql` 을 SQL Editor에서 실행합니다. (이미 돌린 경우 스킵.)

---

## 3단계: DB에 표 두 개 만들기 (마이그레이션 실행)

**의미:** “어느 점주가 어느 가게에 속하는지”, “누가 운영 화면(`/ops`)에 들어갈 수 있는지”를 DB에 저장합니다.  
코드 안에 **이미 SQL 파일**이 있으니, **그 내용을 Supabase SQL Editor에 붙여넣어 실행**하면 됩니다.

### 3-1. 첫 번째 파일 (점주–가게 연결)

1. PC에서 이 레포 열기:  
   `supabase/migrations/20260510183000_merchant_tenant_members.sql`  
2. 파일 **전체 선택 → 복사**  
3. Supabase → **SQL Editor** → **New query** → 붙여넣기 → **Run**

### 3-2. 두 번째 파일 (운영자 권한)

1. `supabase/migrations/20260510210000_platform_operators.sql`  
2. 같은 방식으로 **SQL Editor**에서 **Run**

에러 없이 끝나면 “표가 생긴 것”입니다. (이미 예전에 돌렸다면 “이미 있음”류 메시지가 날 수 있습니다. 그때는 메시지를 읽고 조정하면 됩니다.)

---

## 4단계: “첫 운영자” 한 명 등록하기 (가장 헷갈리는 부분)

**의미:** `/ops` 는 **누구나** 들어가면 안 됩니다.  
Supabase에 **로그인 계정**을 하나 만든 다음, DB의 `platform_operators` 표에 **그 사람의 ID**를 한 줄 넣습니다.

### 4-1. Supabase에서 운영용 이메일 계정 만들기

1. Supabase → **Authentication** → **Users** → **Add user** → **Create new user**  
2. 운영에 쓸 **이메일**, **비밀번호** 입력 → 저장  
3. 같은 화면에서 방금 만든 사용자를 클릭해 **UUID**(긴 문자열)를 복사해 둡니다.

### 4-2. 그 UUID를 운영자 표에 넣기

Supabase → **SQL Editor**에서 아래를 실행합니다.  
`여기에_UUID_붙여넣기` 만 본인 것으로 바꿉니다.

```sql
insert into public.platform_operators (user_id)
values ('여기에_UUID_붙여넣기'::uuid);
```

이제 브라우저에서:

- `https://여러분-app.vercel.app/ops/login`  
- 방금 만든 이메일·비번으로 로그인  

→ **운영 대시보드**로 들어가면 성공입니다.

---

## 5단계: 점주 계정 만들기 (`/ops/merchants`)

**의미:** 운영 화면에서 점주용 Auth 사용자를 만들고 `merchant_tenant_members` 에 가게를 연결합니다. **기본은 이메일·임시 비밀번호**, `NEXT_PUBLIC_MERCHANT_LOGIN_SMS=true` 일 때만 **휴대폰** 폼이 보입니다.

1. 운영자로 `/ops/merchants` 접속  
2. **새 점주 초대**에 테넌트·역할 입력 후 저장  
   - **이메일 모드(기본):** 이메일 + 임시 비밀번호(6자 이상)  
   - **SMS 모드:** 휴대폰(예: `01012345678`)

끝나면 점주는 `https://여러분-app.vercel.app/m/login` 에서 **이메일·비밀번호**로 로그인하거나(SMS 모드면 **인증번호 받기 → 코드 입력**) 주문 화면으로 갑니다.

(SMS로 바꾼 뒤에는 기존 **이메일만** 계정에 전화번호를 연결하거나, 휴대폰으로 다시 초대해야 OTP 로그인할 수 있습니다.)

---

## 6단계: 휴대폰으로 확인

**의미:** 별도 “모바일 앱”을 설치할 필요 없이 **브라우저 주소만** 열면 됩니다.

| 확인할 것 | 주소 예 (도메인은 본인 것) |
|-----------|----------------------------|
| 손님 | `https://…vercel.app/t/demo` |
| 점주 | `https://…vercel.app/m/login` |
| 운영 | `https://…vercel.app/ops/login` |

Wi‑Fi나 회사망이 Supabase 주소를 막으면 “로딩만 된다” 식으로 보일 수 있습니다. 그때는 LTE로 바꿔 보세요.

---

## 자주 나는 문제 (짧게)

- **점주 로그인은 되는데 주문이 안 보인다**  
  → Vercel에 `SUPABASE_SERVICE_ROLE_KEY` 넣었는지, 재배포 했는지 확인.
- **`/ops` 에 “접근 불가”**  
  → `platform_operators` 에 본인 UUID 줄이 들어갔는지 확인.
- **운영 화면에서 점주 초대가 실패**  
  → `SUPABASE_SERVICE_ROLE_KEY` 필수입니다.

---

## 요약 표 (다시 한 번만)

| 해야 할 일 | 어디서 |
|------------|--------|
| URL·anon·service 역할 키 넣기 | Vercel 환경 변수 + 재배포 |
| 이메일 로그인 + Site URL | Supabase Authentication |
| 표 2개 만들기 | SQL Editor에 마이그레이션 두 파일 순서대로 실행 |
| 운영자 1명 | Auth에서 유저 만들기 → `platform_operators`에 UUID insert |
| 점주 만들기 | `/ops/merchants` 폼 또는 SQL |

더 세부적인 점주 병행·RPC 점검은 `docs/MERCHANT_MIGRATION_RUNBOOK.md`, 실사용 실행안은 `docs/MERCHANT_LIVE_EXECUTION_PLAN.md`, 손님 주문 RPC는 `supabase/scripts/verify_guest_order_rpcs.sql` 을 참고하면 됩니다.
