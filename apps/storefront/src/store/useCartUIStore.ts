import { create } from "zustand";

interface CartUIState {
  isOpen: boolean;
  newlyAddedVariantId: string | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setNewlyAddedVariantId: (id: string | null) => void;
}

export const useCartUIStore = create<CartUIState>((set) => ({
  isOpen: false,
  newlyAddedVariantId: null,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  setNewlyAddedVariantId: (id) => set({ newlyAddedVariantId: id }),
}));
