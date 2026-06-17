# Cursor 모델 설정 (CHAYA 권장)

**Claude 고정 + 필요 시 Composer** — Agent가 코드를 대신 고르지 않게, 사람이 UI에서 한 번만 설정합니다.

## 1. Claude 모델 켜기

1. **Cursor** → **Settings** (톱니) → **Models**
2. 목록에서 **Claude 4.6 Sonnet** (또는 **Claude 4.5 Sonnet**) **활성화**
3. 안 보이면 **Show more models** / 숨김 모델 표시 확인

## 2. Agent 기본 모델 고정

1. **Agent** 패널 열기
2. 상단 **모델 이름** 클릭 (Auto / Composer 등으로 보일 수 있음)
3. **Claude 4.6 Sonnet** 선택 — **Auto는 끄기**

같은 설정을 **Ask**, **Plan** 모드에서도 각각 한 번씩 선택해 두면 모드 전환 시에도 유지됩니다.

## 3. 빠른 작업할 때만 Composer

- **`Ctrl + /`** : 모델 순환
- 스타일만 살짝 고칠 때 → **Composer 2.5**로 바꾼 뒤 작업 → 다시 Sonnet으로

## 4. 확인

- 채팅 상단에 **Claude … Sonnet** 이 보이면 성공
- **Auto**만 보이면 아직 Cursor가 모델을 대신 고르는 상태

## 참고

- [Cursor — Available models](https://cursor.com/help/models-and-usage/available-models.md)
- [Models & pricing](https://cursor.com/docs/models)
- 프로젝트 규칙: `.cursor/rules/chaya-cursor-model-preference.mdc`
