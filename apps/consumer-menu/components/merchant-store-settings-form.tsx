"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { updateMerchantStoreProfileFromForm } from "@/app/m/[tenant]/more/actions";
import { ConsumerSessionHeaderPreview } from "@/components/consumer-session-header-preview";
import { ConsumerStoreLogo } from "@/components/consumer-store-logo";
import {
  MERCHANT_IMAGE_ACCEPT,
  MERCHANT_IMAGE_UPLOAD_HINT,
  validateMerchantImageFile,
} from "@/lib/merchant/merchant-image-upload-policy";
import {
  merchantFieldHintClass,
  merchantFieldInputClass,
  merchantFieldLabelClass,
  merchantSaveBtnClass,
  merchantSubCardBodyClass,
  merchantSubCardClass,
} from "@/lib/merchant/merchant-more-sub-styles";
import type { MerchantStoreFocus } from "@/lib/merchant/merchant-store-settings-focus";
import { uploadMerchantLogoFile } from "@/lib/merchant/upload-merchant-logo-client";
import { rethrowNextNavigation } from "@/lib/navigation/rethrow-next-navigation";
import type { TenantStoreSettings } from "@/lib/tenant/tenant-store-settings";
import { getTenantBranding } from "@/lib/tenant/tenant-branding";

type Props = {
  tenant: string;
  settings: TenantStoreSettings;
  canEdit: boolean;
  focus?: MerchantStoreFocus | null;
};

export function MerchantStoreSettingsForm({ tenant, settings, canEdit, focus }: Props) {
  const fallback = getTenantBranding(tenant);
  const displayNameDefault = settings.displayName ?? fallback.displayName;

  const [logoPreview, setLogoPreview] = useState(settings.logoUrl ?? "");
  const [previewName, setPreviewName] = useState(displayNameDefault);
  const [clearLogo, setClearLogo] = useState(false);
  const [showLogoUrl, setShowLogoUrl] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoPickError, setLogoPickError] = useState<string | null>(null);
  const [logoSavedHint, setLogoSavedHint] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadedLogoUrl = useRef<string | null>(null);

  useEffect(() => {
    setLogoPreview(settings.logoUrl ?? "");
    setPreviewName(settings.displayName ?? fallback.displayName);
    setClearLogo(false);
    uploadedLogoUrl.current = null;
  }, [settings.logoUrl, settings.displayName, fallback.displayName]);

  const effectiveLogo = clearLogo ? null : logoPreview.trim() || null;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveError(null);

    const form = formRef.current;
    if (!form) return;

    const fd = new FormData(form);

    if (uploadedLogoUrl.current) {
      fd.set("logo_url", uploadedLogoUrl.current);
    } else if (showLogoUrl) {
      fd.set("logo_url", String(fd.get("logo_url") ?? "").trim());
    } else {
      fd.set("logo_url", "");
    }

    fd.delete("logo_file");

    startTransition(async () => {
      try {
        await updateMerchantStoreProfileFromForm(fd);
      } catch (err) {
        rethrowNextNavigation(err);
        setSaveError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="tenant_slug" value={tenant} />
      <input type="hidden" name="clear_logo" value={clearLogo ? "1" : "0"} />

      <section className={merchantSubCardClass}>
        <div className={`${merchantSubCardBodyClass} space-y-4`}>
          <div>
            <label className={merchantFieldLabelClass}>매장명</label>
            <input
              name="display_name"
              type="text"
              defaultValue={displayNameDefault}
              maxLength={80}
              disabled={!canEdit}
              className={merchantFieldInputClass}
              autoFocus={focus === "name"}
              onChange={(e) => setPreviewName(e.target.value)}
            />
            <p className={merchantFieldHintClass}>손님 메뉴·주문 화면에 표시돼요</p>
          </div>

          <div>
            <label className={merchantFieldLabelClass}>로고 (선택)</label>
            <p className={`${merchantFieldHintClass} mb-2`}>
              {MERCHANT_IMAGE_UPLOAD_HINT} · 없으면 매장명이 강조 표시돼요
            </p>
            <div className="mb-3 rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">손님 화면 미리보기</p>
              <ConsumerSessionHeaderPreview
                displayName={previewName.trim() || displayNameDefault}
                logoUrl={effectiveLogo}
              />
            </div>
            <div className="flex items-start gap-3.5">
              {effectiveLogo ? (
                <ConsumerStoreLogo
                  displayName={previewName.trim() || displayNameDefault}
                  logoUrl={effectiveLogo}
                  sizeClass="h-14 w-14"
                  shape="rounded"
                />
              ) : null}
              {canEdit ? (
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept={MERCHANT_IMAGE_ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setLogoPickError(null);
                      setLogoSavedHint(false);
                      void validateMerchantImageFile(f).then((checked) => {
                        if (!checked.ok) {
                          setLogoPickError(checked.message);
                          if (fileRef.current) fileRef.current.value = "";
                          return;
                        }
                        setLogoBusy(true);
                        void uploadMerchantLogoFile(tenant, f)
                          .then((result) => {
                            if (!result.ok) {
                              setLogoPickError(result.message);
                              if (fileRef.current) fileRef.current.value = "";
                              return;
                            }
                            uploadedLogoUrl.current = result.url;
                            setClearLogo(false);
                            setLogoPreview(result.url);
                            setShowLogoUrl(false);
                            setLogoSavedHint(true);
                          })
                          .finally(() => setLogoBusy(false));
                      });
                    }}
                  />
                  <button
                    type="button"
                    disabled={logoBusy}
                    onClick={() => fileRef.current?.click()}
                    className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-[#E5E7EB] bg-[#F2F3F5] text-sm font-bold text-[#4B5563] disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    <ImagePlus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                    {logoBusy ? "사진 올리는 중…" : "사진 넣기"}
                  </button>
                  {logoPickError ? (
                    <p role="alert" className="text-xs font-semibold text-[#DC2626]">
                      {logoPickError}
                    </p>
                  ) : logoSavedHint ? (
                    <p className="text-xs font-semibold text-[#059669]">로고가 저장됐어요.</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowLogoUrl((v) => !v)}
                    className="text-left text-xs font-semibold text-chaya-primary"
                  >
                    {showLogoUrl ? "URL 입력 닫기 ›" : "또는 URL로 입력 ›"}
                  </button>
                  {showLogoUrl ? (
                    <input
                      name="logo_url"
                      type="url"
                      defaultValue={clearLogo ? "" : settings.logoUrl ?? ""}
                      readOnly={clearLogo}
                      disabled={!canEdit}
                      className={merchantFieldInputClass}
                      placeholder="https://..."
                      autoFocus={focus === "logo"}
                      onChange={() => {
                        uploadedLogoUrl.current = null;
                        setClearLogo(false);
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
            {canEdit && (effectiveLogo || settings.logoUrl) && !clearLogo ? (
              <button
                type="button"
                onClick={() => {
                  setClearLogo(true);
                  setLogoPreview("");
                  uploadedLogoUrl.current = null;
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#DC2626]"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                로고 제거
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {saveError ? (
        <p role="alert" className="text-sm font-semibold text-[#DC2626]">
          {saveError}
        </p>
      ) : null}

      {canEdit ? (
        <button type="submit" disabled={pending || logoBusy} className={merchantSaveBtnClass}>
          {pending ? "저장 중…" : "저장"}
        </button>
      ) : (
        <p className="rounded-[10px] bg-[#F2F3F5] px-3 py-2.5 text-xs font-medium text-[#4B5563] dark:bg-zinc-900">
          매장 설정 변경은 소장(owner) 계정만 가능합니다.
        </p>
      )}
    </form>
  );
}
