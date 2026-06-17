import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function OrdersLayout({ children }: Props) {
  return <>{children}</>;
}
