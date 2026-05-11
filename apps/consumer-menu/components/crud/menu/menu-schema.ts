export type MenuInput = {
  id?: string;
  tenant_slug: string;
  name: string;
  price: number;
  category?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  sort_order?: number | null;
  is_sold_out?: boolean;
};

export const menuDefaultInput: MenuInput = {
  tenant_slug: "",
  name: "",
  price: 0,
  category: "",
  description: "",
  imageUrl: "",
  sort_order: null,
  is_sold_out: false,
};
