"use client";
import { Button, useToast } from "@dashboard/ui";
import { motion } from "framer-motion";
import Link from "next/link";

import { useWishlist, useRemoveFromWishlist } from "@/api/wishlist";
import { useAuthStore } from "@/store/useAuthStore";

export default function WishlistPage() {
  const { data, isLoading } = useWishlist();
  const removeMutation = useRemoveFromWishlist();
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const handleRemove = (productId: string) => {
    removeMutation.mutate(productId, {
      onSuccess: () => {
        addToast({
          title: "Removed from Wishlist",
          type: "info",
        });
      },
      onError: (err: any) => {
        addToast({
          title: "Failed to remove from Wishlist",
          description: err.message || "An unexpected error occurred.",
          type: "error",
        });
      },
    });
  };

  if (!user) {
    return (
      <div className="bg-background min-h-[70vh]">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center py-24 bg-surface rounded-2xl border border-border shadow-sm max-w-2xl mx-auto">
            <h2 className="text-2xl font-serif text-text-primary mb-4">Sign in to view your wishlist</h2>
            <p className="text-text-secondary font-light mb-8">Save your favorite cute creations for later.</p>
            <Link href="/auth/login?redirect=/wishlist"><Button size="lg" className="px-8 shadow-sm hover:shadow-md transition-shadow">Sign In</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-[0.2em] text-accent uppercase mb-4">Favorites</p>
          <h1 className="text-4xl font-serif text-text-primary">My Wishlist</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="text-center py-24 bg-surface rounded-2xl border border-border shadow-sm max-w-2xl mx-auto">
            <h2 className="text-2xl font-serif text-text-primary mb-4">No favorites yet</h2>
            <p className="text-text-secondary font-light mb-8">Save your favorite cute creations here for later.</p>
            <Link href="/products"><Button size="lg" className="px-8 shadow-sm hover:shadow-md transition-shadow">Explore Collection</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data?.items?.map((item: any, i: number) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-6 p-6 border border-border rounded-2xl bg-surface relative shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                  {item.product.images?.[0]?.url ? (
                    <img src={encodeURI(item.product.images[0].url)} alt={item.product.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="font-serif text-xs text-text-secondary text-center p-1">{item.product.name}</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={`/products/${item.product?.slug}`} className="font-serif text-lg text-text-primary hover:text-accent transition-colors line-clamp-2 leading-tight">
                      {item.product.name}
                    </Link>
                    <p className="text-base text-text-primary mt-2">₹{item.product.basePrice}</p>
                  </div>
                  <button 
                    onClick={() => handleRemove(item.productId)}
                    className="text-sm text-text-secondary hover:text-accent self-start transition-colors font-medium mt-2 cursor-pointer"
                    disabled={removeMutation.isPending}
                  >
                    {removeMutation.isPending ? "Removing..." : "Remove"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}