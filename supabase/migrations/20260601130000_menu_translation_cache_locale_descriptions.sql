-- menu_translation_cache: 일·중 설명 컬럼 추가 (영어 en_desc 는 기존)
alter table menu_translation_cache
  add column if not exists ja_desc text,
  add column if not exists zh_hans_desc text,
  add column if not exists zh_hant_desc text;
