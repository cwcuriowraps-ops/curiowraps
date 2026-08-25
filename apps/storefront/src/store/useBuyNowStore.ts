import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BuyNowItem {
  variantId: string;
  quantity: number;
  customization?: string;
  productSnapshot?: {
    name: string;
    slug: string;
    image?: string;
  };
  variantSnapshot?: {
    title: string;
    price: number;
  };
}

interface BuyNowState {
  item: BuyNowItem | null;
  setItem: (item: BuyNowItem | null) => void;
  clearItem: () => void;
}

export const useBuyNowStore = create<BuyNowState>()(
  persist(
    (set) => ({
      item: null,
      setItem: (item) => set({ item }),
      clearItem: () => set({ item: null }),
    }),
    {
      name: 'buy-now-storage',
    }
  )
);
