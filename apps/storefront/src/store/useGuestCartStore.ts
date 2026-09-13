import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GuestCartItem {
  productId: string;
  variantId: string;
  quantity: number;
  customization?: string;
  addedAt: number;
  productSnapshot?: {
    name: string;
    slug: string;
    image?: string;
    variantTitle?: string;
  };
}

interface GuestCartState {
  items: GuestCartItem[];
  addItem: (item: Omit<GuestCartItem, "addedAt">) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variantId === item.variantId && i.customization === item.customization
          );
          if (existingIndex > -1) {
            const existing = state.items[existingIndex];
            if (existing) {
              const updated = [...state.items];
              updated[existingIndex] = {
                ...existing,
                quantity: existing.quantity + item.quantity,
              };
              return { items: updated };
            }
          }
          return { items: [...state.items, { ...item, addedAt: Date.now() }] };
        }),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity } : i
                ),
        })),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),
      clearCart: () => set({ items: [] }),
      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: "curio-guest-cart",
    }
  )
);
