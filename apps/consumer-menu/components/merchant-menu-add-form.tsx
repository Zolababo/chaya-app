"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, X } from "lucide-react";

import { createMenuFromForm } from "@/app/m/[tenant]/menus/actions";
import type { MenuOptionGroup } from "@/lib/menus/menu-options";
import { uploadMerchantMenuImageStaging } from "@/lib/merchant/upload-merchant-menu-image-client";

type Props = {
  tenant: string;
  categoryFilter: string | null;
  existingCategories: string[];
};

type StatusMode = "selling" | "soldout";

function fmtPrice(raw: string): string {
  const n = Number(raw.replace(/[^0-9]/g, ""));
  if (!raw) return "";
  return isNaN(n) ? raw : n.toLocaleString("ko-KR") + "원";
}

function newChoiceId() {
  return `c-${Math.random().toString(36).slice(2, 8)}`;
}
function newGroupId() {
  return `g-${Math.random().toString(36).slice(2, 8)}`;
}

export function MerchantMenuAddForm({ tenant, categoryFilter, existingCategories }: Props) {
  const tEnc = encodeURIComponent(tenant);
  const listHref = categoryFilter
    ? `/m/${tEnc}/menus?category=${encodeURIComponent(categoryFilter)}`
    : `/m/${tEnc}/menus`;

  // ── 탭 ──
  const [tab, setTab] = useState<"basic" | "photo" | "option">("basic");

  // ── 기본 정보 ──
  const [priceRaw, setPriceRaw] = useState("");
  const [category, setCategory] = useState(categoryFilter ?? "");
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // ── 판매 상태 ──
  const [statusMode, setStatusMode] = useState<StatusMode>("selling");

  // ── 노출 옵션 ──
  const [todaysPick, setTodaysPick] = useState(false);
  const [storeRecommended, setStoreRecommended] = useState(false);

  // ── 옵션 그룹 ──
  const [optGroups, setOptGroups] = useState<MenuOptionGroup[]>([]);

  // ── 모달 ──
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stagedImageUrl, setStagedImageUrl] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const priceDisplay = fmtPrice(priceRaw);
  const priceNum = Number(priceRaw.replace(/[^0-9]/g, ""));

  const allCategories = Array.from(
    new Set([...existingCategories, ...(category ? [category] : [])].filter(Boolean)),
  );

  const handleCategorySelect = (val: string) => {
    if (val === "__new__") {
      setShowNewCat(true);
      setCategory("");
    } else {
      setCategory(val);
      setShowNewCat(false);
    }
  };

  const addNewCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    setCategory(name);
    setNewCatName("");
    setShowNewCat(false);
  };

  // ── 옵션 그룹 조작 ──
  const addGroup = () => {
    setOptGroups((prev) => [
      ...prev,
      { id: newGroupId(), name: "", required: false, choices: [{ id: newChoiceId(), label: "", priceDelta: 0 }] },
    ]);
  };

  const updateGroupName = (gid: string, name: string) => {
    setOptGroups((prev) => prev.map((g) => (g.id === gid ? { ...g, name } : g)));
  };

  const toggleGroupRequired = (gid: string) => {
    setOptGroups((prev) => prev.map((g) => (g.id === gid ? { ...g, required: !g.required } : g)));
  };

  const removeGroup = (gid: string) => {
    setOptGroups((prev) => prev.filter((g) => g.id !== gid));
  };

  const addChoice = (gid: string) => {
    setOptGroups((prev) =>
      prev.map((g) =>
        g.id === gid
          ? { ...g, choices: [...g.choices, { id: newChoiceId(), label: "", priceDelta: 0 }] }
          : g,
      ),
    );
  };

  const updateChoice = (
    gid: string,
    cid: string,
    field: "label" | "priceDelta",
    val: string | number,
  ) => {
    setOptGroups((prev) =>
      prev.map((g) =>
        g.id === gid
          ? {
              ...g,
              choices: g.choices.map((c) =>
                c.id === cid
                  ? { ...c, [field]: field === "priceDelta" ? Number(val) || 0 : val }
                  : c,
              ),
            }
          : g,
      ),
    );
  };

  const removeChoice = (gid: string, cid: string) => {
    setOptGroups((prev) =>
      prev.map((g) => (g.id === gid ? { ...g, choices: g.choices.filter((c) => c.id !== cid) } : g)),
    );
  };

  // ── 저장 흐름 ──
  const handleSaveClick = () => {
    const form = formRef.current;
    if (!form) return;
    const nameEl = form.elements.namedItem("name") as HTMLInputElement | null;
    if (!nameEl?.value?.trim() || !priceRaw) {
      form.reportValidity();
      return;
    }
    setShowPriceModal(true);
  };

  const handleConfirmSave = () => {
    setShowPriceModal(false);
    const form = formRef.current;
    if (!form) return;

    setSaveError(null);
    setSaveBusy(true);

    void (async () => {
      try {
        const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
        const picked = fileInput?.files?.[0];

        if (picked && picked.size > 0) {
          const uploaded = await uploadMerchantMenuImageStaging(tenant, picked);
          if (!uploaded.ok) {
            setSaveError(uploaded.message);
            return;
          }
          setStagedImageUrl(uploaded.url);
          const imageHidden = form.elements.namedItem("imageUrl") as HTMLInputElement | null;
          if (imageHidden) imageHidden.value = uploaded.url;
          if (fileInput) fileInput.value = "";
        }

        form.requestSubmit();
      } finally {
        setSaveBusy(false);
      }
    })();
  };

  // 저장 버튼 (모든 탭에서 공통)
  const SaveButtons = (
    <div className="flex gap-2">
      <Link
        href={listHref}
        className="flex h-12 flex-1 items-center justify-center rounded-xl border border-zinc-200 text-[14px] font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
      >
        목록으로
      </Link>
      <button
        type="button"
        disabled={saveBusy}
        onClick={handleSaveClick}
        className="flex h-12 flex-[2] items-center justify-center rounded-xl bg-chaya-primary text-[15px] font-extrabold text-white disabled:opacity-60"
      >
        {saveBusy ? "저장 중…" : "메뉴 추가"}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── 탭 네비 ── */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
        {(["basic", "photo", "option"] as const).map((t) => {
          const labels = { basic: "기본", photo: "사진", option: "옵션" };
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                "px-4 py-2.5 text-[13px] font-semibold transition",
                tab === t
                  ? "border-b-2 border-chaya-primary text-chaya-primary"
                  : "text-zinc-500 dark:text-zinc-400",
              ].join(" ")}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {saveError ? (
        <p role="alert" className="text-sm font-semibold text-[#DC2626]">
          {saveError}
        </p>
      ) : null}

      {/* 단일 form — 탭마다 다른 영역을 show/hide */}
      <form ref={formRef} action={createMenuFromForm} encType="multipart/form-data" className="flex flex-col gap-3">
        <input type="hidden" name="tenant_slug" value={tenant} />
        <input type="hidden" name="imageUrl" value={stagedImageUrl} />
        {categoryFilter ? <input type="hidden" name="preserve_category" value={categoryFilter} /> : null}
        <input type="hidden" name="is_sold_out" value={statusMode === "soldout" ? "on" : ""} />
        <input type="hidden" name="is_todays_pick" value={todaysPick ? "on" : ""} />
        <input type="hidden" name="is_store_recommended" value={storeRecommended ? "on" : ""} />
        <input type="hidden" name="category" value={category} />
        <input
          type="hidden"
          name="options_json"
          value={optGroups.length > 0 ? JSON.stringify(optGroups) : ""}
        />

        {/* ════ 기본 탭 ════ */}
        <div className={tab === "basic" ? "flex flex-col gap-3" : "hidden"}>
          {/* 기본 정보 카드 */}
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            <p className="mb-1 text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50">기본 정보</p>
            <p className="mb-4 text-[11px] text-zinc-400">손님 메뉴판에 바로 표시되는 항목이에요</p>

            {/* 이름 */}
            <div className="mb-3">
              <label className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
                메뉴 이름 <span className="text-chaya-primary">*</span>
              </label>
              <input
                name="name"
                required
                maxLength={200}
                placeholder="예: 된장찌개"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-[14px] font-semibold text-zinc-900 outline-none transition focus:border-chaya-primary focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>

            {/* 가격 */}
            <div className="mb-3">
              <label className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
                가격 <span className="text-chaya-primary">*</span>
              </label>
              <div className="relative">
                <input
                  name="price"
                  type="text"
                  inputMode="numeric"
                  required
                  value={priceRaw}
                  onChange={(e) => setPriceRaw(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="예: 10000"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-3.5 pr-24 text-[14px] font-semibold text-zinc-900 outline-none transition focus:border-chaya-primary focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                />
                {priceDisplay ? (
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-chaya-primary">
                    {priceDisplay}
                  </span>
                ) : null}
              </div>
            </div>

            {/* 카테고리 */}
            <div className="mb-3">
              <label className="mb-1.5 block text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
                카테고리
              </label>
              <div className="relative">
                <select
                  value={showNewCat ? "__new__" : category || ""}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 pr-10 text-[14px] font-semibold text-zinc-900 outline-none transition focus:border-chaya-primary focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                >
                  <option value="">카테고리 선택</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__new__">＋ 새 카테고리 추가</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
              {showNewCat ? (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="새 카테고리 이름"
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addNewCategory())
                    }
                    className="min-w-0 flex-1 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-[13px] font-semibold outline-none focus:border-blue-500 dark:border-blue-700 dark:bg-blue-950/30 dark:text-zinc-50"
                  />
                  <button
                    type="button"
                    onClick={addNewCategory}
                    className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-[12px] font-bold text-white"
                  >
                    추가
                  </button>
                </div>
              ) : null}
            </div>

            {/* 설명 */}
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
                메뉴 설명
              </label>
              <textarea
                name="description"
                rows={3}
                maxLength={2000}
                placeholder="예: 부모님의 손맛이 담긴 구수한 된장찌개"
                className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-[13px] text-zinc-900 outline-none transition focus:border-chaya-primary focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                한국어 설명은 직접 작성해 주세요. 저장 시 AI가 외국어·맵기(🌶)만 채웁니다.
              </p>
            </div>
          </div>

          {/* 판매 상태 카드 */}
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            <p className="mb-3 text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50">판매 상태</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatusMode("selling")}
                className={[
                  "flex flex-col items-center rounded-xl border-[1.5px] px-3 py-3 transition",
                  statusMode === "selling"
                    ? "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800",
                ].join(" ")}
              >
                <span className="mb-1 text-[20px]">✅</span>
                <span
                  className={`text-[12px] font-bold ${statusMode === "selling" ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"}`}
                >
                  판매 중
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStatusMode("soldout")}
                className={[
                  "flex flex-col items-center rounded-xl border-[1.5px] px-3 py-3 transition",
                  statusMode === "soldout"
                    ? "border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-950/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800",
                ].join(" ")}
              >
                <span className="mb-1 text-[20px]">⏸</span>
                <span
                  className={`text-[12px] font-bold ${statusMode === "soldout" ? "text-orange-600 dark:text-orange-400" : "text-zinc-600 dark:text-zinc-400"}`}
                >
                  품절 처리
                </span>
              </button>
            </div>
          </div>

          {/* 노출 옵션 카드 */}
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            <p className="mb-3 text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50">노출 옵션</p>
            <ToggleRow
              label="오늘의 메뉴"
              desc="손님 메뉴판 상단에 강조 표시돼요"
              checked={todaysPick}
              onChange={setTodaysPick}
            />
            <ToggleRow
              label="사장님 Pick"
              desc="목록에 추천 뱃지가 붙어요"
              checked={storeRecommended}
              onChange={setStoreRecommended}
            />
          </div>

          {SaveButtons}
        </div>

        {/* ════ 사진 탭 ════ */}
        <div className={tab === "photo" ? "flex flex-col gap-3" : "hidden"}>
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            <p className="mb-1 text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50">메뉴 사진</p>
            <p className="mb-4 text-[11px] text-zinc-400">
              갤러리·카메라 사진 OK · 큰 사진은 자동으로 줄여서 저장해요
            </p>

            <div className="mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-8 dark:border-zinc-700">
              <span className="mb-2 text-[32px]">📷</span>
              <p className="text-[13px] font-bold text-zinc-500">사진을 선택해 등록해보세요</p>
              <p className="mt-1 text-[11px] text-zinc-400">사진이 없으면 기본 이모지로 표시돼요</p>
            </div>

            <label className="mb-1.5 block text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
              사진 선택 <span className="font-normal text-zinc-400">(선택)</span>
            </label>
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/*"
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-chaya-primary file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
            />
            <p className="mt-1 text-[11px] text-zinc-400">· 등록 후 사진 탭에서 언제든 교체 가능해요</p>
          </div>

          {SaveButtons}
        </div>

        {/* ════ 옵션 탭 ════ */}
        <div className={tab === "option" ? "flex flex-col gap-3" : "hidden"}>
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            <p className="mb-1 text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50">주문 옵션</p>
            <p className="mb-4 text-[11px] text-zinc-400">
              손님이 주문할 때 선택할 수 있는 옵션을 추가해요 · 선택지마다 추가 금액을 설정할 수 있어요
            </p>

            <div className="flex flex-col gap-3">
              {optGroups.map((grp) => (
                <OptionGroupCard
                  key={grp.id}
                  group={grp}
                  onNameChange={(v) => updateGroupName(grp.id, v)}
                  onRequiredToggle={() => toggleGroupRequired(grp.id)}
                  onRemove={() => removeGroup(grp.id)}
                  onAddChoice={() => addChoice(grp.id)}
                  onChoiceChange={(cid, f, v) => updateChoice(grp.id, cid, f, v)}
                  onChoiceRemove={(cid) => removeChoice(grp.id, cid)}
                />
              ))}

              <button
                type="button"
                onClick={addGroup}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-3 text-[13px] font-bold text-zinc-400 transition active:border-chaya-primary active:text-chaya-primary dark:border-zinc-700"
              >
                <Plus className="h-4 w-4" />
                옵션 추가하기
              </button>
            </div>
          </div>

          {SaveButtons}
        </div>
      </form>

      {/* ════ 가격 확인 모달 ════ */}
      {showPriceModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setShowPriceModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl bg-white p-5 pb-10 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <p className="mb-1.5 text-[16px] font-extrabold text-zinc-900 dark:text-zinc-50">
              이 가격이 맞나요?
            </p>
            <p className="mb-4 text-[13px] leading-relaxed text-zinc-500">
              저장 전에 한 번 더 확인해요.
              <br />
              손님 메뉴판에 그대로 표시돼요.
            </p>
            <div className="mb-5 rounded-xl bg-red-50 py-4 text-center dark:bg-red-950/30">
              <span className="text-[28px] font-black text-chaya-primary">
                {priceNum > 0 ? priceNum.toLocaleString("ko-KR") : "0"}
              </span>
              <span className="ml-1 text-[14px] font-bold text-chaya-primary">원</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPriceModal(false)}
                className="flex h-12 flex-1 items-center justify-center rounded-xl bg-zinc-100 text-[14px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                다시 입력
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex h-12 flex-[2] items-center justify-center rounded-xl bg-chaya-primary text-[15px] font-extrabold text-white"
              >
                맞아요, 등록
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── 토글 행 ──────────────────────────────────────────────────
function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-100 py-3 first:border-t-0 dark:border-zinc-800">
      <div>
        <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-50">{label}</p>
        <p className="mt-0.5 text-[11px] text-zinc-400">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative ml-3 h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-emerald-400" : "bg-zinc-300 dark:bg-zinc-600",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-all duration-200",
            checked ? "left-[23px]" : "left-[3px]",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

// ── 옵션 그룹 카드 ───────────────────────────────────────────
function OptionGroupCard({
  group,
  onNameChange,
  onRequiredToggle,
  onRemove,
  onAddChoice,
  onChoiceChange,
  onChoiceRemove,
}: {
  group: MenuOptionGroup;
  onNameChange: (v: string) => void;
  onRequiredToggle: () => void;
  onRemove: () => void;
  onAddChoice: () => void;
  onChoiceChange: (cid: string, field: "label" | "priceDelta", val: string | number) => void;
  onChoiceRemove: (cid: string) => void;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
      <div className="mb-2.5 flex items-center gap-2">
        <input
          type="text"
          value={group.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="옵션 이름 (예: 맵기, 사이즈)"
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] font-semibold text-zinc-900 outline-none focus:border-chaya-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={group.required}
          onClick={onRequiredToggle}
          className={[
            "relative h-5 w-8 shrink-0 rounded-full transition-colors",
            group.required ? "bg-chaya-primary" : "bg-zinc-300 dark:bg-zinc-600",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
              group.required ? "left-[16px]" : "left-0.5",
            ].join(" ")}
          />
        </button>
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          {group.required ? "필수 선택" : "선택 사항"}
        </span>
      </div>

      <div className="mb-1.5 flex items-center gap-2 px-0.5">
        <span className="flex-1 text-[10px] font-bold text-zinc-400">선택지</span>
        <span className="w-20 text-center text-[10px] font-bold text-zinc-400">추가 금액</span>
        <span className="w-6" />
      </div>

      <div className="flex flex-col gap-1.5">
        {group.choices.map((choice) => (
          <div key={choice.id} className="flex items-center gap-1.5">
            <input
              type="text"
              value={choice.label}
              onChange={(e) => onChoiceChange(choice.id, "label", e.target.value)}
              placeholder="선택지 이름"
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[12px] font-semibold text-zinc-900 outline-none focus:border-chaya-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              type="text"
              inputMode="numeric"
              value={choice.priceDelta === 0 ? "" : String(choice.priceDelta)}
              onChange={(e) =>
                onChoiceChange(choice.id, "priceDelta", e.target.value.replace(/[^0-9-]/g, ""))
              }
              placeholder="+0원"
              className="w-20 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-right text-[11px] font-semibold text-zinc-900 outline-none focus:border-chaya-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <button
              type="button"
              onClick={() => onChoiceRemove(choice.id)}
              className="flex h-7 w-6 shrink-0 items-center justify-center rounded-md text-zinc-300 hover:text-zinc-500"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAddChoice}
          className="mt-1 w-full rounded-lg border border-dashed border-zinc-200 py-2 text-[12px] font-semibold text-zinc-400 dark:border-zinc-700"
        >
          ＋ 선택지 추가
        </button>
      </div>
    </div>
  );
}
