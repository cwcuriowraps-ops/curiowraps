"use client";

import { Button, useToast } from "@dashboard/ui";
import Link from "next/link";

import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/api/cart";
import { getImageUrl } from "@/lib/image-utils";
import { sanitizeErrorMessage } from "@/lib/toast-utils";
import { useAuthStore } from "@/store/useAuthStore";

export default function CartPage() {
  const { data, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const { user } = useAuthStore();
  const { addToast } = useToast();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif text-text-primary">Your Cart</h1>
        <div className="mt-12 h-[400px] animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  const cart = data?.cart;
  const items = cart?.items || [];

  const handleUpdateQuantity = (itemId: string, quantity: number, _productName?: string) => {
    updateItem.mutate(
      { itemId, quantity },
      {
        onError: (err) => {
          addToast({
            title: "Update Failed",
            description: sanitizeErrorMessage(err, "Could not update cart quantity. Please try again."),
            type: "error",
          });
        },
      }
    );
  };

  const handleRemoveItem = (itemId: string, _productName?: string) => {
    removeItem.mutate(itemId, {
      onError: (err) => {
        addToast({
          title: "Removal Failed",
          description: sanitizeErrorMessage(err, "Could not remove item from cart. Please try again."),
          type: "error",
        });
      },
    });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif text-text-primary mb-6">
          Your cart is empty
        </h1>
        <p className="text-lg text-text-secondary font-light mb-10">
          Looks like you haven't added any cute creations to your cart yet.
        </p>
        <Link href="/products">
          <Button size="lg" className="px-8 shadow-sm hover:shadow-md transition-shadow">Explore Collection</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <h1 className="text-4xl font-serif text-text-primary mb-12">
          Your Cart
        </h1>

        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">
              Items in your shopping cart
            </h2>

            <ul role="list" className="divide-y divide-border border-t border-border">
              {items.map((item: any) => (
                <li key={item.id} className="flex py-8">
                  <div className="flex-shrink-0">
                    {item.variant?.product?.images?.[0]?.url ? (
                      <img
                        src={getImageUrl(item.variant.product.images[0].url)}
                        alt={item.variant?.product?.name || "Product"}
                        className="h-32 w-32 rounded-xl object-cover object-center bg-muted"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-xl bg-muted flex items-center justify-center text-text-secondary font-serif text-xs text-center p-2">
                        {item.variant?.product?.name}
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-1 flex-col justify-between">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-lg font-serif">
                            <Link
                              href={`/products/${item.variant?.product?.slug}`}
                              className="text-text-primary hover:text-accent transition-colors"
                            >
                              {item.variant?.product?.name}
                            </Link>
                          </h3>
                        </div>
                        <div className="mt-1 flex text-sm">
                          <p className="text-text-secondary font-light">{item.variant?.name}</p>
                        </div>
                        {item.customization && (
                          <div className="mt-2 rounded-lg bg-muted/60 p-2.5 text-xs text-text-secondary border border-border">
                            <span className="font-semibold block mb-0.5 text-text-primary text-[10px] uppercase tracking-wider">Customization Instructions</span>
                            <p className="whitespace-pre-wrap font-light">{item.customization}</p>
                          </div>
                        )}
                        <p className="mt-4 text-base font-medium text-text-primary">
                          ₹{parseFloat(item.variant?.price?.toString() || "0")}
                        </p>
                        <p className="text-xs text-text-secondary font-light mt-1">
                          Subtotal: ₹{(parseFloat(item.variant?.price?.toString() || "0") * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        <div className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.variantId, Math.max(1, item.quantity - 1), item.variant?.product?.name)}
                            disabled={item.quantity <= 1 || updateItem.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-muted hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <span className="text-base font-medium">-</span>
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-text-primary">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.variantId, item.quantity + 1, item.variant?.product?.name)}
                            disabled={updateItem.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
                            aria-label="Increase quantity"
                          >
                            <span className="text-base font-medium">+</span>
                          </button>
                        </div>

                        <div className="absolute right-0 top-0">
                          <button
                            type="button"
                            className="-m-2 inline-flex p-2 text-text-secondary hover:text-accent transition-colors"
                            onClick={() => handleRemoveItem(item.variantId, item.variant?.product?.name)}
                            disabled={removeItem.isPending}
                          >
                            <span className="sr-only">Remove</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Order summary */}
          <section
            aria-labelledby="summary-heading"
            className="mt-16 rounded-2xl bg-surface p-6 sm:p-8 lg:col-span-5 lg:mt-0 border border-border"
          >
            <h2 id="summary-heading" className="text-2xl font-serif text-text-primary mb-6">
              Order Summary
            </h2>

            {/* Free Shipping Progress Indicator */}
            {cart.totals?.freeShippingThreshold > 0 && (
              <div className="mb-6 rounded-xl bg-accent/5 p-4 border border-accent/15 text-xs text-text-primary">
                {cart.totals?.subtotal >= cart.totals?.freeShippingThreshold ? (
                  <p className="font-medium text-emerald-600 flex items-center gap-1.5">
                    <span>🎉</span> Congratulations! You qualify for <strong>FREE Shipping</strong>!
                  </p>
                ) : (
                  <p className="font-light text-text-secondary">
                    Add <strong className="text-accent font-semibold">₹{(cart.totals.freeShippingThreshold - cart.totals.subtotal).toFixed(2)}</strong> more to get <strong>FREE Shipping</strong>!
                  </p>
                )}
              </div>
            )}

            <dl className="space-y-4 text-sm text-text-secondary font-light">
              <div className="flex items-center justify-between">
                <dt>Subtotal</dt>
                <dd className="font-medium text-text-primary">₹{cart.totals?.subtotal?.toFixed(2) ?? "0.00"}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <dt className="flex flex-col">
                  <span>Shipping Fee</span>
                  {cart.totals?.estimatedDeliveryDays && (
                    <span className="text-[11px] text-text-secondary font-light">({cart.totals.estimatedDeliveryDays})</span>
                  )}
                </dt>
                <dd className="font-medium text-text-primary">
                  {cart.totals?.shipping === 0 ? (
                    <span className="text-emerald-600 font-semibold">FREE</span>
                  ) : (
                    `₹${cart.totals?.shipping?.toFixed(2) ?? "0.00"}`
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <dt className="flex items-center">
                  <span>{cart.totals?.taxLabel || "Tax"}</span>
                </dt>
                <dd className="font-medium text-text-primary">₹{cart.totals?.tax?.toFixed(2) ?? "0.00"}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <dt className="text-base font-medium text-text-primary">Order Total</dt>
                <dd className="text-xl font-medium text-text-primary">₹{cart.totals?.grandTotal?.toFixed(2) ?? "0.00"}</dd>
              </div>
            </dl>

            <div className="mt-8">
              <Link href={user ? "/checkout" : "/auth/login?redirect=/checkout"}>
                <Button size="lg" className="w-full shadow-sm hover:shadow-md transition-shadow">
                  {user ? "Proceed to Checkout" : "Sign in to Checkout"}
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
