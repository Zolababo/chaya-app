"use client";

import type { MenuOptionGroup, SelectedMenuOption } from "@/lib/menus/menu-options";

type Props = {
  groups: MenuOptionGroup[];
  selected: SelectedMenuOption[];
  onChange: (next: SelectedMenuOption[]) => void;
};

export function MenuItemOptionGroups({ groups, selected, onChange }: Props) {
  if (groups.length === 0) return null;

  const pick = (group: MenuOptionGroup, choiceId: string) => {
    const choice = group.choices.find((c) => c.id === choiceId);
    if (!choice) return;
    const row: SelectedMenuOption = {
      groupId: group.id,
      groupName: group.name,
      choiceId: choice.id,
      choiceLabel: choice.label,
      priceDelta: choice.priceDelta,
    };
    const rest = selected.filter((s) => s.groupId !== group.id);
    onChange([...rest, row]);
  };

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const current = selected.find((s) => s.groupId === group.id)?.choiceId ?? "";
        return (
          <fieldset
            key={group.id}
            className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <legend className="px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {group.name}
              {group.required ? (
                <span className="ml-1 text-xs font-normal text-amber-700 dark:text-amber-300">(필수)</span>
              ) : null}
            </legend>
            <div className="mt-2 space-y-2">
              {group.choices.map((choice) => {
                const id = `opt-${group.id}-${choice.id}`;
                return (
                  <label
                    key={choice.id}
                    htmlFor={id}
                    className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1 has-[:checked]:border-chaya-primary has-[:checked]:bg-chaya-primary/5 dark:has-[:checked]:bg-orange-950/30"
                  >
                    <input
                      id={id}
                      type="radio"
                      name={`menu-opt-${group.id}`}
                      value={choice.id}
                      checked={current === choice.id}
                      onChange={() => pick(group, choice.id)}
                      className="h-4 w-4 shrink-0"
                    />
                    <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {choice.label}
                      {choice.priceDelta !== 0 ? (
                        <span className="ml-2 text-xs text-zinc-500">
                          {choice.priceDelta > 0 ? "+" : ""}
                          {choice.priceDelta.toLocaleString("ko-KR")}원
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
