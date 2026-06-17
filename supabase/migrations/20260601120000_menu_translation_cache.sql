-- AI 번역 캐시 테이블
-- Gemini 등 AI가 생성한 한국 음식명 번역 결과를 저장.
-- ko_name: 정규화 키(공백 제거·소문자). service_role 전용 write.
create table if not exists menu_translation_cache (
  ko_name       text primary key,
  en_name       text,
  ja_name       text,
  zh_hans_name  text,
  zh_hant_name  text,
  en_desc       text,
  source        text not null default 'gemini',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table menu_translation_cache enable row level security;

-- 인증된 점주(점주 서버 액션은 service_role 우회)는 캐시 조회만.
-- service_role 은 RLS 우회 → INSERT/UPDATE 별도 정책 불필요.
create policy "authenticated_read_translation_cache"
  on menu_translation_cache
  for select
  using (auth.role() = 'authenticated');

comment on table menu_translation_cache is
  'Gemini AI 자동 번역 캐시 — 한식진흥원 DB 미매칭 메뉴명 저장. ko_name은 공백 제거+소문자 정규화 키.';
