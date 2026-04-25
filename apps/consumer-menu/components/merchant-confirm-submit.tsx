"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
};

export function MerchantConfirmSubmitButton({ confirmMessage, onClick, type = "submit", ...rest }: Props) {
  return (
    <button
      type={type}
      {...rest}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
        onClick?.(e);
      }}
    />
  );
}
