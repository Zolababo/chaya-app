"use client";

import { useRef, useState, useId, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

import { updateMenuFromForm, deleteMenuFromForm } from "@/app/m/[tenant]/menus/actions";
import type { ChayaMenuRow } from "@/lib/menus/types";
import type { MenuOptionGroup, MenuOptionChoice } from "@/lib/menus/menu-options";
import { uploadMerchantMenuImageFile } from "@/lib/merchant/upload-merchant-menu-image-client";
import {
  MERCHANT_IMAGE_ACCEPT,
  MERCHANT_IMAGE_UPLOAD_HINT,
  validateMerchantImageFile,
} from "@/lib/merchant/merchant-image-upload-policy";

// ── 타입 ──────────────────────────────────────────────────────
type StatusMode = "selling" | "soldout";

type Props = {
  tenant: string;
  item: ChayaMenuRow;
  categoryFilter: string | null;
  canDeleteMenus: boolean;
  activeTab: "basic" | "photo" | "advanced";
  existingCategories: string[];
};

// ── 유틸 ─────────────────────────────────────────────────────
function fmtPrice(raw: string): string {
  const n = Number(raw.replace(/,/g, "").replace(/[^0-9]/g, ""));
  if (!n && raw === "") return "";
  return isNaN(n) ? raw : n.toLocaleString("ko-KR") + "원";
}

function newChoiceId() {
  return `c-${Math.random().toString(36).slice(2, 8)}`;
}
function newGroupId() {
  return `g-${Math.random().toString(36).slice(2, 8)}`;
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export function MerchantMenuEditForm({
  tenant,
  item,
  categoryFilter,
  canDeleteMenus,
  activeTab: initialTab,
  existingCategories,
}: Props) {
  const tEnc = encodeURIComponent(tenant);
  const listHref = categoryFilter
    ? `/m/${tEnc}/menus?category=${encodeURIComponent(categoryFilter)}`
    : `/m/${tEnc}/menus`;

  // ── 탭 상태 ──
  const [tab, setTab] = useState<"basic" | "photo" | "option">(
    initialTab === "photo" ? "photo" : "basic",
  );

  // ── 기본 정보 ──
  const [priceRaw, setPriceRaw] = useState(String(item.price));
  const [category, setCategory] = useState(item.category ?? "");
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // ── 판매 상태 ──
  const [statusMode, setStatusMode] = useState<StatusMode>(item.isSoldOut ? "soldout" : "selling");

  // ── 노출 옵션 ──
  const [todaysPick, setTodaysPick] = useState(item.isTodaysPick);
  const [storeRecommended, setStoreRecommended] = useState(item.isStoreRecommended);

  // ── 옵션 그룹 ──
  const [optGroups, setOptGroups] = useState<MenuOptionGroup[]>(
    item.optionGroups.length > 0
      ? item.optionGroups
      : [],
  );

  // ── 모달 ──
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── 사진 탭 ──
  const [imagePreview, setImagePreview] = useState(item.imageUrl ?? "");
  const [imageBusy, setImageBusy] = useState(false);
  const [imagePickError, setImagePickError] = useState<string | null>(null);
  const [imageSavedHint, setImageSavedHint] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImagePreview(item.imageUrl ?? "");
  }, [item.imageUrl]);

  // ── form refs ──
  const mainFormRef = useRef<HTMLFormElement>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  const priceDisplay = fmtPrice(priceRaw);
  const priceNum = Number(priceRaw.replace(/[^0-9]/g, ""));

  // ── 카테고리 처리 ──
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
    setOptGroups((prev) => prev.map((g) => g.id === gid ? { ...g, name } : g));
  };

  const toggleGroupRequired = (gid: string) => {
    setOptGroups((prev) => prev.map((g) => g.id === gid ? { ...g, required: !g.required } : g));
  };

  const removeGroup = (gid: string) => {
    setOptGroups((prev) => prev.filter((g) => g.id !== gid));
  };

  const addChoice = (gid: string) => {
    setOptGroups((prev) => prev.map((g) =>
      g.id === gid
        ? { ...g, choices: [...g.choices, { id: newChoiceId(), label: "", priceDelta: 0 }] }
        : g,
    ));
  };

  const updateChoice = (gid: string, cid: string, field: "label" | "priceDelta", val: string | number) => {
    setOptGroups((prev) => prev.map((g) =>
      g.id === gid
        ? {
            ...g,
            choices: g.choices.map((c) =>
              c.id === cid ? { ...c, [field]: field === "priceDelta" ? Number(val) || 0 : val } : c,
            ),
          }
        : g,
    ));
  };

  const removeChoice = (gid: string, cid: string) => {
    setOptGroups((prev) => prev.map((g) =>
      g.id === gid ? { ...g, choices: g.choices.filter((c) => c.id !== cid) } : g,
    ));
  };

  // ── 저장 흐름 ──
  const handleSaveClick = () => {
    if (!priceNum && priceRaw) return; // 비정상 입력
    setShowPriceModal(true);
  };

  const handleConfirmSave = () => {
    setShowPriceModal(false);
    mainFormRef.current?.requestSubmit();
  };

  const handleDeleteClick = () => setShowDeleteModal(true);
  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    deleteFormRef.current?.requestSubmit();
  };

  // ── 공통 hidden 필드 ──
  const commonHidden = (
    <>
      <input type="hidden" name="tenant_slug" value={tenant} />
      <input type="hidden" name="menu_id" value={item.id} />
      <input type="hidden" name="return_to" value="edit" />
      {categoryFilter ? <input type="hidden" name="preserve_category" value={categoryFilter} /> : null}
    </>
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

      {/* ════ 기본 탭 ════ */}
      {tab === "basic" ? (
        <form ref={mainFormRef} action={updateMenuFromForm} encType="multipart/form-data" className="flex flex-col gap-3">
          {commonHidden}
          {/* 상태 hidden 입력 */}
          <input type="hidden" name="is_sold_out" value={statusMode === "soldout" ? "on" : ""} />
          <input type="hidden" name="is_todays_pick" value={todaysPick ? "on" : ""} />
          <input type="hidden" name="is_store_recommended" value={storeRecommended ? "on" : ""} />
          {/* 옵션 JSON */}
          <input type="hidden" name="options_json" value={optGroups.length > 0 ? JSON.stringify(optGroups) : ""} />
          {/* sort_order 유지 */}
          <input type="hidden" name="sort_order" value={String(item.sortOrder)} />

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
                defaultValue={item.name}
                placeholder="예: 된장찌개"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-[14px] font-semibold text-zinc-900 outline-none transition focus:border-chaya-primary focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:bg-zinc-800"
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
              <p className="mt-1 text-[11px] text-zinc-400">저장할 때 한 번 더 확인할 수 있어요</p>
            </div>

            {/* 카테고리 */}
            <div className="mb-3">
              <label className="mb-1.5 block text-[12px] font-bold text-zinc-700 dark:text-zinc-300">카테고리</label>
              <div className="relative">
                <select
                  value={showNewCat ? "__new__" : category || ""}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 pr-10 text-[14px] font-semibold text-zinc-900 outline-none transition focus:border-chaya-primary focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                >
                  <option value="">카테고리 선택</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__new__">＋ 새 카테고리 추가</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                {/* 실제 form 제출용 hidden input */}
                <input type="hidden" name="category" value={category} />
              </div>
              {showNewCat ? (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="새 카테고리 이름"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNewCategory())}
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
              <label className="mb-1.5 block text-[12px] font-bold text-zinc-700 dark:text-zinc-300">메뉴 설명</label>
              <textarea
                name="description"
                rows={3}
                maxLength={2000}
                defaultValue={item.description ?? ""}
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
            <p className="mb-1 text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50">판매 상태</p>
            <p className="mb-3 text-[11px] text-zinc-400">손님 메뉴판에 어떻게 표시할지 선택해요</p>
            <div className="grid grid-cols-2 gap-2">
              {/* 판매 중 */}
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
                <span className={`text-[12px] font-bold ${statusMode === "selling" ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                  판매 중
                </span>
                <span className="mt-0.5 text-[10px] text-zinc-400">메뉴판에 정상 표시</span>
              </button>
              {/* 품절 */}
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
                <span className={`text-[12px] font-bold ${statusMode === "soldout" ? "text-orange-600 dark:text-orange-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                  품절
                </span>
                <span className="mt-0.5 text-[10px] text-zinc-400">메뉴판에 흐리게 표시</span>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-zinc-400">
              {statusMode === "selling"
                ? "· 판매 중: 손님이 정상 주문할 수 있어요"
                : "· 품절: 메뉴판에 흐리게 표시되고 주문은 불가해요"}
            </p>
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

          {/* 저장 + 목록 버튼 */}
          <div className="flex gap-2">
            <Link
              href={listHref}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-zinc-200 text-[14px] font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              목록으로
            </Link>
            <button
              type="button"
              onClick={handleSaveClick}
              className="flex h-12 flex-[2] items-center justify-center rounded-xl bg-chaya-primary text-[15px] font-extrabold text-white"
            >
              저장하기
            </button>
          </div>

          {/* 삭제 링크 */}
          {canDeleteMenus ? (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="py-2 text-center text-[12px] font-semibold text-zinc-400 underline underline-offset-2 dark:text-zinc-500"
            >
              이 메뉴 삭제
            </button>
          ) : null}
        </form>
      ) : null}

      {/* ════ 사진 탭 ════ */}
      {tab === "photo" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            <p className="mb-1 text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50">메뉴 사진</p>
            <p className="mb-4 text-[11px] text-zinc-400">
              갤러리·카메라 사진 OK · 큰 사진은 자동으로 줄여서 저장해요
            </p>

            {imagePreview ? (
              <div className="relative mb-4 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="h-44 w-full rounded-xl object-cover" />
                <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  손님에게 이렇게 보여요
                </span>
              </div>
            ) : (
              <div className="mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-8 dark:border-zinc-700">
                <span className="mb-2 text-[32px]">📷</span>
                <p className="text-[13px] font-bold text-zinc-500">사진을 선택해 등록해보세요</p>
              </div>
            )}

            <input
              ref={imageFileRef}
              type="file"
              accept={MERCHANT_IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setImagePickError(null);
                setImageSavedHint(false);
                void validateMerchantImageFile(f).then((checked) => {
                  if (!checked.ok) {
                    setImagePickError(checked.message);
                    if (imageFileRef.current) imageFileRef.current.value = "";
                    return;
                  }
                  setImageBusy(true);
                  void uploadMerchantMenuImageFile(tenant, item.id, f)
                    .then((result) => {
                      if (!result.ok) {
                        setImagePickError(result.message);
                        if (imageFileRef.current) imageFileRef.current.value = "";
                        return;
                      }
                      setImagePreview(result.url);
                      setImageSavedHint(true);
                    })
                    .finally(() => setImageBusy(false));
                });
              }}
            />
            <button
              type="button"
              disabled={imageBusy}
              onClick={() => imageFileRef.current?.click()}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-chaya-primary text-[15px] font-extrabold text-white disabled:opacity-60"
            >
              {imageBusy ? "사진 올리는 중…" : imagePreview ? "사진 교체" : "사진 선택"}
            </button>
            {imagePickError ? (
              <p role="alert" className="mt-2 text-xs font-semibold text-[#DC2626]">
                {imagePickError}
              </p>
            ) : imageSavedHint ? (
              <p className="mt-2 text-xs font-semibold text-[#059669]">사진이 저장됐어요.</p>
            ) : (
              <p className="mt-2 text-[11px] text-zinc-400">
                · {MERCHANT_IMAGE_UPLOAD_HINT} · 사진 교체 시 기존 사진은 삭제돼요
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              href={listHref}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-zinc-200 text-[14px] font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              목록으로
            </Link>
          </div>
        </div>
      ) : null}

      {/* ════ 옵션 탭 ════ */}
      {tab === "option" ? (
        <form ref={mainFormRef} action={updateMenuFromForm} encType="multipart/form-data" className="flex flex-col gap-3">
          {commonHidden}
          <input type="hidden" name="is_sold_out" value={statusMode === "soldout" ? "on" : ""} />
          <input type="hidden" name="is_todays_pick" value={todaysPick ? "on" : ""} />
          <input type="hidden" name="is_store_recommended" value={storeRecommended ? "on" : ""} />
          <input type="hidden" name="options_json" value={optGroups.length > 0 ? JSON.stringify(optGroups) : ""} />
          <input type="hidden" name="sort_order" value={String(item.sortOrder)} />
          <input type="hidden" name="name" value={item.name} />
          <input type="hidden" name="price" value={priceRaw || String(item.price)} />
          <input type="hidden" name="category" value={category} />

          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            <p className="mb-1 text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50">주문 옵션</p>
            <p className="mb-4 text-[11px] text-zinc-400">손님이 주문할 때 선택할 수 있는 옵션을 추가해요 · 선택지마다 추가 금액을 설정할 수 있어요</p>

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

          <div className="flex gap-2">
            <Link href={listHref} className="flex h-12 flex-1 items-center justify-center rounded-xl border border-zinc-200 text-[14px] font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
              목록으로
            </Link>
            <button
              type="button"
              onClick={handleSaveClick}
              className="flex h-12 flex-[2] items-center justify-center rounded-xl bg-chaya-primary text-[15px] font-extrabold text-white"
            >
              저장하기
            </button>
          </div>
        </form>
      ) : null}

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
            <p className="mb-1.5 text-[16px] font-extrabold text-zinc-900 dark:text-zinc-50">이 가격이 맞나요?</p>
            <p className="mb-4 text-[13px] leading-relaxed text-zinc-500">
              저장 전에 한 번 더 확인해요.<br />손님 메뉴판에 그대로 표시돼요.
            </p>
            <div className="mb-5 rounded-xl bg-red-50 py-4 text-center dark:bg-red-950/30">
              <span className="text-[28px] font-black text-chaya-primary">
                {priceNum > 0 ? priceNum.toLocaleString("ko-KR") : "0"}
              </span>
              <span className="ml-1 text-[14px] font-bold text-chaya-primary">원</span>
              <p className="mt-1 text-[11px] text-zinc-400">{item.name}</p>
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
                맞아요, 저장
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ════ 삭제 확인 모달 ════ */}
      {showDeleteModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl bg-white p-5 pb-10 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <p className="mb-1.5 text-center text-[32px]">🗑</p>
            <p className="mb-1.5 text-center text-[16px] font-extrabold text-zinc-900 dark:text-zinc-50">메뉴를 삭제할까요?</p>
            <p className="mb-4 text-center text-[13px] leading-relaxed text-zinc-500">
              {item.name}을(를) 삭제하려고 해요.<br />삭제 후에는 복구할 수 없어요.
            </p>
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
              <span>⚠️</span>
              <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">
                삭제하면 주문 내역에서도 메뉴 이름이 사라져요
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex h-12 flex-1 items-center justify-center rounded-xl bg-zinc-100 text-[14px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex h-12 flex-1 items-center justify-center rounded-xl bg-red-600 text-[14px] font-extrabold text-white"
              >
                삭제할게요
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 숨겨진 삭제 폼 */}
      {canDeleteMenus ? (
        <form ref={deleteFormRef} action={deleteMenuFromForm} className="hidden">
          <input type="hidden" name="tenant_slug" value={tenant} />
          <input type="hidden" name="menu_id" value={item.id} />
          {categoryFilter ? <input type="hidden" name="preserve_category" value={categoryFilter} /> : null}
          <button type="submit">삭제</button>
        </form>
      ) : null}
    </div>
  );
}

// ── 토글 행 ───────────────────────────────────────────────────
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

// ── 옵션 그룹 카드 ────────────────────────────────────────────
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
      {/* 옵션 이름 + 삭제 */}
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

      {/* 필수 여부 토글 */}
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

      {/* 선택지 헤더 */}
      <div className="mb-1.5 flex items-center gap-2 px-0.5">
        <span className="flex-1 text-[10px] font-bold text-zinc-400">선택지</span>
        <span className="w-20 text-center text-[10px] font-bold text-zinc-400">추가 금액</span>
        <span className="w-6" />
      </div>

      {/* 선택지 목록 */}
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
              onChange={(e) => onChoiceChange(choice.id, "priceDelta", e.target.value.replace(/[^0-9-]/g, ""))}
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
