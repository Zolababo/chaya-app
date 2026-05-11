export type CategoryInput = {
  id?: string;
  tenant_slug: string;
  name: string;
  sort_order?: number | null;
  is_active?: boolean;
};

export const categoryDefaultInput: CategoryInput = {
  tenant_slug: "",
  name: "",
  sort_order: null,
  is_active: true,
};
