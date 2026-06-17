import { MERCHANT_PASSWORD_MIN_LENGTH } from "@/lib/merchant/merchant-password-auth";
import {
  merchantFieldHintClass,
  merchantFieldInputClass,
  merchantFieldLabelClass,
  merchantSaveBtnClass,
  merchantSubCardBodyClass,
  merchantSubCardClass,
} from "@/lib/merchant/merchant-more-sub-styles";

type Props = {
  tenant: string;
};

export function MerchantAccountPasswordForm({ tenant }: Props) {
  const action = `/m/${encodeURIComponent(tenant)}/more/account/change-password/submit`;

  return (
    <form action={action} method="post">
      <section className={merchantSubCardClass}>
        <div className={`${merchantSubCardBodyClass} space-y-4`}>
          <div>
            <label className={merchantFieldLabelClass} htmlFor="m-current-password">
              현재 비밀번호
            </label>
            <input
              id="m-current-password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
              className={merchantFieldInputClass}
            />
          </div>
          <div>
            <label className={merchantFieldLabelClass} htmlFor="m-account-new-password">
              새 비밀번호
            </label>
            <input
              id="m-account-new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MERCHANT_PASSWORD_MIN_LENGTH}
              className={merchantFieldInputClass}
            />
            <p className={merchantFieldHintClass}>{MERCHANT_PASSWORD_MIN_LENGTH}자 이상 입력해주세요</p>
          </div>
          <div>
            <label className={merchantFieldLabelClass} htmlFor="m-account-new-password2">
              새 비밀번호 확인
            </label>
            <input
              id="m-account-new-password2"
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={MERCHANT_PASSWORD_MIN_LENGTH}
              className={merchantFieldInputClass}
            />
            <p className={merchantFieldHintClass}>매장·주방 태블릿도 같은 비밀번호로 로그인해요</p>
          </div>
          <button type="submit" className={merchantSaveBtnClass}>
            비밀번호 변경
          </button>
        </div>
      </section>
    </form>
  );
}
