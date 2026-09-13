"use client";

import { ThemeToggle, Logo, Button, useToast } from "@dashboard/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/api/cart";
import { useWishlist } from "@/api/wishlist";
import { getImageUrl } from "@/lib/image-utils";
import { sanitizeErrorMessage } from "@/lib/toast-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartUIStore } from "@/store/useCartUIStore";
import { useGuestCartStore } from "@/store/useGuestCartStore";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { addToast } = useToast();
  const { data: cartData } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const { data: wishlistData } = useWishlist();
  const guestCartCount = useGuestCartStore((state) => state.getItemCount());
  const cartItemCount = user
    ? (cartData?.cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0)
    : guestCartCount;
  const wishlistCount = wishlistData?.items?.length || 0;

  const isOpen = useCartUIStore((state) => state.isOpen);
  const newlyAddedVariantId = useCartUIStore((state: any) => state.newlyAddedVariantId);
  const closeCart = useCartUIStore((state) => state.closeCart);
  const [isHovered, setIsHovered] = useState(false);
  const showMiniCart = isOpen || isHovered;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeCart();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeCart]);

  const profileHref = user ? "/account" : "/auth/login";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Curio Wraps Home" className="flex items-center">
          <Logo size={52} />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium tracking-wide text-text-secondary transition-colors duration-normal hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creations..."
                className="h-9 w-48 rounded-full border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                autoFocus
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="text-text-secondary hover:text-accent transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          )}
          <Link href="/wishlist" aria-label="Wishlist" className="text-text-secondary hover:text-accent transition-colors block relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && (
              <span 
                key={wishlistCount}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white ring-2 ring-background animate-badge-pop"
              >
                {wishlistCount}
              </span>
            )}
          </Link>
          <div 
            ref={dropdownRef}
            className="relative py-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Link href="/cart" aria-label="Cart" className="text-text-secondary hover:text-accent transition-colors block relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="21" r="1.5" />
                <circle cx="20" cy="21" r="1.5" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartItemCount > 0 && (
                <span 
                  key={cartItemCount}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white ring-2 ring-background animate-badge-pop"
                >
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Mini Cart Dropdown */}
            {showMiniCart && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-surface p-4 shadow-xl z-50 animate-fade-in-slide-down">
                {cartData?.cart?.items?.length === 0 || !cartData?.cart ? (
                  <div className="text-center py-6 text-text-secondary font-light text-sm">
                    Your cart is empty
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="max-h-60 overflow-y-auto flex flex-col gap-3 pr-1 scrollbar-thin">
                      {cartData.cart.items.map((item: any) => {
                        const isNewlyAdded = item.variantId === newlyAddedVariantId;
                        return (
                          <div 
                            key={item.id} 
                            className={`flex gap-3 p-2 rounded-lg border border-transparent transition-all duration-300 ${
                              isNewlyAdded 
                                ? 'animate-highlight-fade border-accent/20' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            {item.variant?.product?.images?.[0]?.url ? (
                              <img 
                                src={getImageUrl(item.variant.product.images[0].url)} 
                                alt={item.variant?.product?.name} 
                                className="w-12 h-12 object-cover rounded-lg bg-muted flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-text-secondary font-serif text-[9px] text-center p-0.5 flex-shrink-0">
                                {item.variant?.product?.name}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="text-xs font-serif truncate text-text-primary pr-2">{item.variant?.product?.name}</h4>
                                 <button
                                  type="button"
                                  onClick={() =>
                                    removeCartItem.mutate(item.variantId, {
                                      onError: (err: any) =>
                                        addToast({
                                          title: "Removal Failed",
                                          description: sanitizeErrorMessage(err, "Could not remove item from cart."),
                                          type: "error",
                                        }),
                                    })
                                  }
                                  className="text-text-secondary hover:text-accent text-xs p-0.5"
                                  title="Remove"
                                >
                                  ×
                                </button>
                              </div>
                              <p className="text-[10px] text-text-secondary truncate font-light mt-0.5">{item.variant?.name}</p>
                              {item.customization && (
                                <p className="text-[9px] text-accent font-medium truncate mt-0.5">
                                  ✨ {item.customization}
                                </p>
                              )}
                              <div className="flex justify-between items-center mt-2">
                                <div className="inline-flex items-center border border-border rounded-full bg-background px-1 py-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCartItem.mutate(
                                        { itemId: item.variantId, quantity: Math.max(1, item.quantity - 1) },
                                        {
                                          onError: (err: any) =>
                                            addToast({
                                              title: "Update Failed",
                                              description: sanitizeErrorMessage(err, "Could not update cart quantity."),
                                              type: "error",
                                            }),
                                        }
                                      )
                                    }
                                    disabled={item.quantity <= 1 || updateCartItem.isPending}
                                    className="h-4 w-4 flex items-center justify-center text-[10px] text-text-secondary hover:text-text-primary disabled:opacity-30"
                                  >
                                    -
                                  </button>
                                  <span className="px-1.5 text-[10px] font-medium text-text-primary">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCartItem.mutate(
                                        { itemId: item.variantId, quantity: item.quantity + 1 },
                                        {
                                          onError: (err: any) =>
                                            addToast({
                                              title: "Update Failed",
                                              description: sanitizeErrorMessage(err, "Could not update cart quantity."),
                                              type: "error",
                                            }),
                                        }
                                      )
                                    }
                                    disabled={updateCartItem.isPending}
                                    className="h-4 w-4 flex items-center justify-center text-[10px] text-text-secondary hover:text-text-primary"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-xs font-medium text-text-primary">₹{(parseFloat(item.variant?.price?.toString() || "0") * item.quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between items-center text-sm font-medium mb-3">
                        <span className="text-text-secondary font-light">Subtotal:</span>
                        <span className="text-text-primary font-bold">₹{cartData.cart.totals?.subtotal?.toFixed(2) ?? "0.00"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link href="/cart" className="w-full">
                          <Button variant="outline" size="sm" className="w-full text-xs py-1 h-9 rounded-full">View Cart</Button>
                        </Link>
                        <Link href={user ? "/checkout" : "/auth/login?redirect=/checkout"} className="w-full">
                          <Button size="sm" className="w-full text-xs py-1 h-9 rounded-full">Checkout</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <Link href={profileHref} aria-label="Profile" className="text-text-secondary hover:text-accent transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <Link href="/cart" aria-label="Cart" className="text-text-secondary hover:text-accent transition-colors relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1.5" />
              <circle cx="20" cy="21" r="1.5" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartItemCount > 0 && (
              <span 
                key={cartItemCount}
                className="absolute -right-2 -top-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white ring-2 ring-background animate-badge-pop"
              >
                {cartItemCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="text-text-secondary hover:text-accent transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 12h16M4 6h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="absolute left-0 top-20 w-full border-b border-border bg-background px-4 py-6 md:hidden shadow-lg">
          <div className="flex flex-col gap-4">
            {/* Mobile Search */}
            <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creations..."
                className="h-10 flex-1 rounded-full border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg font-medium text-text-primary hover:text-accent transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            <Link href="/wishlist" className="text-lg font-medium text-text-primary hover:text-accent transition-colors" onClick={() => setMobileOpen(false)}>Wishlist</Link>
            <Link href={profileHref} className="text-lg font-medium text-text-primary hover:text-accent transition-colors" onClick={() => setMobileOpen(false)}>
              {user ? "My Account" : "Sign In"}
            </Link>
            <div className="pt-2"><ThemeToggle /></div>
          </div>
        </nav>
      )}
    </header>
  );
}
