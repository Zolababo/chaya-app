import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** 목업 `.stores-table-wrap` */
export function OpsDataTable({ children, className = "" }: Props) {
  return (
    <div className={`overflow-hidden rounded-xl border border-ops-border bg-ops-surface ${className}`}>
      <table className="w-full min-w-[720px] border-collapse text-left">{children}</table>
    </div>
  );
}

export function OpsDataTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-ops-border bg-ops-surface-2 text-[11px] font-bold tracking-[0.06em] text-[#4A5568] uppercase">
      {children}
    </thead>
  );
}

export function OpsDataTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}
