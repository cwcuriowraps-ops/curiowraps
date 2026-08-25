"use client";

import { Button, Input, useToast } from "@dashboard/ui";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, QrCode, Tag, X, Info } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useCart } from "@/api/cart";
import { useValidateCoupon } from "@/api/coupons";
import { useCreateOrder } from "@/api/orders";
import { useCreateCodPayment, useCreateUpiPayment } from "@/api/payments";
import { usePublicSettings } from "@/api/settings";
import { sanitizeErrorMessage } from "@/lib/toast-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useBuyNowStore } from "@/store/useBuyNowStore";

function CheckoutContent() {
  const { user } = useAuthStore();
  const { data, isLoading, isFetching } = useCart();
  const { data: settings } = usePublicSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get("buyNow") === "true";
  const buyNowItem = useBuyNowStore((state) => state.item);

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD">("UPI");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [upiError, setUpiError] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const createOrder = useCreateOrder();
  const createUpiPayment = useCreateUpiPayment();
  const createCodPayment = useCreateCodPayment();
  const validateCoupon = useValidateCoupon();

  const { register, handleSubmit } = useForm();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/checkout");
    }
  }, [user, router]);

  if (!user || isLoading || isFetching) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif text-text-primary">Checkout</h1>
        <div className="mt-12 h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  const cart = data?.cart;
  let items = cart?.items || [];

  if (isBuyNow && buyNowItem) {
    items = [{
      id: "buy-now-item",
      quantity: buyNowItem.quantity,
      customization: buyNowItem.customization,
      variantId: buyNowItem.variantId,
      variant: {
        id: buyNowItem.variantId,
        name: buyNowItem.variantSnapshot?.title,
        price: buyNowItem.variantSnapshot?.price,
        product: {
          name: buyNowItem.productSnapshot?.name,
          slug: buyNowItem.productSnapshot?.slug,
          images: buyNowItem.productSnapshot?.image ? [{ url: buyNowItem.productSnapshot.image }] : []
        }
      }
    }];
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center py-32 text-center">
        <h1 className="text-4xl font-serif text-text-primary mb-6">Your cart is empty</h1>
        <Button onClick={() => router.push("/products")} size="lg" className="rounded-full px-8">Continue Shopping</Button>
      </div>
    );
  }

  let subtotal = cart?.totals?.subtotal ?? 0;
  let shipping = cart?.totals?.shipping ?? 0;
  let tax = cart?.totals?.tax ?? 0;
  let estimatedDeliveryDays = cart?.totals?.estimatedDeliveryDays;
  let taxLabel = cart?.totals?.taxLabel || "Tax";

  if (isBuyNow && buyNowItem) {
    subtotal = (buyNowItem.variantSnapshot?.price || 0) * buyNowItem.quantity;

    let baseShippingCharge = 100;
    let freeShippingThreshold = 1000;
    let shippingEnabled = true;
    let taxPercentage = 18;
    let taxEnabled = true;

    if (settings?.shipping) {
      if (settings.shipping.baseShippingCharge !== undefined) baseShippingCharge = Number(settings.shipping.baseShippingCharge);
      if (settings.shipping.freeShippingThreshold !== undefined) freeShippingThreshold = Number(settings.shipping.freeShippingThreshold);
      if (settings.shipping.estimatedDeliveryDays) estimatedDeliveryDays = String(settings.shipping.estimatedDeliveryDays);
      if (settings.shipping.enabled !== undefined) shippingEnabled = Boolean(settings.shipping.enabled);
    }

    if (settings?.taxes) {
      if (settings.taxes.taxPercentage !== undefined) taxPercentage = Number(settings.taxes.taxPercentage);
      if (settings.taxes.taxLabel) taxLabel = String(settings.taxes.taxLabel);
      if (settings.taxes.enabled !== undefined) taxEnabled = Boolean(settings.taxes.enabled);
    }

    shipping = 0;
    if (subtotal > 0 && shippingEnabled) {
      if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
        shipping = 0;
      } else {
        shipping = baseShippingCharge;
      }
    }

    tax = 0;
    if (subtotal > 0 && taxEnabled && taxPercentage > 0) {
      tax = Math.round((subtotal * (taxPercentage / 100)) * 100) / 100;
    }
  }

  const discount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = Math.max(0, subtotal + shipping + tax - discount);

  const upiSettings = settings?.payments;
  const upiId = upiSettings?.upiId || "curiowraps@upi";
  const upiQrImageUrl = upiSettings?.upiQrImageUrl || "";

  const handleCopyUpiId = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    addToast({
      title: "UPI ID Copied! 📋",
      description: `Copied '${upiId}' to clipboard.`,
      type: "success",
    });
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponError("");
    try {
      const res = await validateCoupon.mutateAsync({
        code: couponInput.trim().toUpperCase(),
        cartTotal: subtotal,
      });

      if (res.isValid || res.coupon) {
        setAppliedCoupon({
          code: couponInput.trim().toUpperCase(),
          discountAmount: res.discountAmount,
        });
        setCouponError("");
        addToast({
          title: "Coupon Applied! 🎉",
          description: `You saved ₹${res.discountAmount.toFixed(2)} with code '${couponInput.trim().toUpperCase()}'.`,
          type: "success",
        });
      } else {
        const errMsg = "Invalid or expired coupon code";
        setCouponError(errMsg);
      }
    } catch (err: any) {
      const errMsg = sanitizeErrorMessage(err, "Failed to validate coupon");
      setCouponError(errMsg);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const onSubmit = async (values: Record<string, string>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setCheckoutError("");
    try {
      const shippingAddress = {
        firstName: values.firstName?.trim() || "",
        lastName: values.lastName?.trim() || "",
        line1: values.address?.trim() || "",
        city: values.city?.trim() || "",
        postalCode: values.postalCode?.trim() || "",
      };

      if (Object.values(shippingAddress).some((value) => !value)) {
        setCheckoutError("Please fill out all required shipping address fields.");
        return;
      }

      // 1. Prepare order payload
      const orderPayload: any = {
        paymentMethod,
        shippingAddress,
        couponCode: appliedCoupon?.code || undefined,
        notes: "Created from Storefront Checkout",
      };

      if (isBuyNow && buyNowItem) {
        orderPayload.buyNowItem = {
          variantId: buyNowItem.variantId,
          quantity: buyNowItem.quantity,
          customization: buyNowItem.customization,
        };
      }

      if (paymentMethod === "UPI") {
        const trimmedTxId = upiTransactionId.trim();
        if (!trimmedTxId) {
          setUpiError("Enter the transaction ID from your UPI payment.");
          setIsSubmitting(false);
          return;
        }
        if (trimmedTxId.length < 6 || trimmedTxId.length > 50) {
          setUpiError("Transaction ID must be between 6 and 50 characters.");
          setIsSubmitting(false);
          return;
        }
        orderPayload.upiTransactionId = trimmedTxId;
        setUpiError("");
      }

      const orderResult = await createOrder.mutateAsync(orderPayload);
      const order = orderResult.order || orderResult;

      if (isBuyNow) {
        useBuyNowStore.getState().clearItem();
      }

      if (paymentMethod === "COD") {
        // 2. COD flow
        await createCodPayment.mutateAsync(order.id);
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        router.push("/checkout/success");
      } else {
        // 2. Manual UPI flow
        await createUpiPayment.mutateAsync({ orderId: order.id, upiTransactionId: upiTransactionId.trim() });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        router.push("/checkout/success");
      }
    } catch (error: any) {
      console.error("Checkout failed:", error);
      const errorMsg = sanitizeErrorMessage(error, "Could not place the order. Please try again.");
      setCheckoutError(errorMsg);
      addToast({
        title: "Checkout Failed",
        description: errorMsg,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif text-text-primary mb-12">Checkout</h1>

        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          <section className="lg:col-span-7">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-12">
                <h2 className="text-2xl font-serif text-text-primary mb-6">Contact Information</h2>
                <div className="mt-4">
                  <Input label="Email address" type="email" defaultValue={user.email} disabled className="rounded-xl" />
                </div>
              </div>

              <div className="mb-12 border-t border-border pt-12">
                <h2 className="text-2xl font-serif text-text-primary mb-6">Shipping Details</h2>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <Input label="First name" {...register("firstName")} defaultValue={user.firstName} className="rounded-xl" />
                  <Input label="Last name" {...register("lastName")} defaultValue={user.lastName} className="rounded-xl" />
                  <div className="sm:col-span-2">
                    <Input label="Address" {...register("address")} className="rounded-xl" />
                  </div>
                  <Input label="City" {...register("city")} className="rounded-xl" />
                  <Input label="Postal code" {...register("postalCode")} className="rounded-xl" />
                </div>
              </div>

              <div className="mb-12 border-t border-border pt-12">
                <h2 className="text-2xl font-serif text-text-primary mb-6">Payment Method</h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`border p-6 rounded-2xl cursor-pointer transition-all ${paymentMethod === "UPI"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border hover:border-accent/50"
                      }`}
                    onClick={() => setPaymentMethod("UPI")}
                  >
                    <span className="font-medium text-text-primary flex items-center gap-2 mb-1">
                      <QrCode className="w-5 h-5 text-accent" /> UPI Payment
                    </span>
                    <span className="text-sm text-text-secondary font-light">Scan QR or Pay via UPI ID</span>
                  </div>

                  <div
                    className={`border p-6 rounded-2xl cursor-pointer transition-all ${paymentMethod === "COD"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border hover:border-accent/50"
                      }`}
                    onClick={() => setPaymentMethod("COD")}
                  >
                    <span className="font-medium text-text-primary block mb-1">Cash on Delivery</span>
                    <span className="text-sm text-text-secondary font-light">Pay when your order arrives</span>
                  </div>
                </div>

                {/* Manual UPI Display Box */}
                {paymentMethod === "UPI" && (
                  <div className="mt-6 rounded-2xl border border-accent/30 bg-surface p-6 sm:p-8 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-text-primary">Pay via UPI</h3>
                        <p className="text-xs text-text-secondary">Google Pay, PhonePe, Paytm, BHIM or any UPI app</p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                        Total: ₹{finalTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                      {/* Responsive QR Code Display */}
                      {upiQrImageUrl ? (
                        <div className="relative group">
                          <img
                            src={upiQrImageUrl}
                            alt="UPI QR Code"
                            className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-2xl border border-border p-2 bg-white shadow-md transition-transform hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center p-4 text-center">
                          <QrCode className="w-12 h-12 text-text-secondary mb-2" />
                          <p className="text-xs text-text-secondary font-medium">QR Code image configured in Admin settings</p>
                        </div>
                      )}

                      {/* UPI ID display & copy button */}
                      <div className="w-full max-w-sm space-y-2 pt-2">
                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Store UPI ID</p>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                          <span className="font-mono text-sm font-bold text-text-primary truncate mr-2">{upiId}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCopyUpiId}
                            className="rounded-lg shrink-0 text-xs gap-1.5"
                          >
                            {copiedUpi ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy UPI ID
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Payment Instructions */}
                    <div className="rounded-xl bg-muted/50 p-4 border border-border text-xs space-y-2 text-text-secondary">
                      <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                        <Info className="w-4 h-4 text-accent" /> Payment Instructions
                      </div>
                      <ol className="list-decimal list-inside space-y-1 font-light leading-relaxed">
                        <li>Scan the QR code above or copy the UPI ID into your UPI app.</li>
                        <li>Transfer the exact total amount of <strong className="text-text-primary font-semibold">₹{finalTotal.toFixed(2)}</strong>.</li>
                        <li>Enter your UPI Transaction/Reference ID below.</li>
                        <li>Click <strong className="text-text-primary font-semibold">&quot;Place Order (UPI)&quot;</strong> below to submit your order.</li>
                      </ol>
                    </div>

                    {/* UPI Transaction ID Input */}
                    <div className="space-y-1.5 pt-2">
                      <label htmlFor="upiTxId" className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                        UPI Transaction ID <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="upiTxId"
                        name="upiTransactionId"
                        type="text"
                        placeholder="e.g. 423456789012 or UPI Ref No."
                        value={upiTransactionId}
                        onChange={(e) => {
                          setUpiTransactionId(e.target.value);
                          if (upiError) setUpiError("");
                        }}
                        className="rounded-xl font-mono text-sm"
                      />
                      <p className="text-[11px] text-text-secondary font-light">
                        Enter the transaction ID from your UPI payment.
                      </p>
                      {upiError && <p className="text-xs text-red-500 font-medium">{upiError}</p>}
                    </div>
                  </div>
                )}
              </div>

              {checkoutError && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 text-center font-medium">
                  {checkoutError}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full shadow-md hover:shadow-lg transition-shadow rounded-full"
                loading={isSubmitting || createOrder.isPending || createUpiPayment.isPending || createCodPayment.isPending}
                loadingText={paymentMethod === "COD" ? "Placing order…" : "Processing payment…"}
                disabled={isSubmitting || createOrder.isPending || createUpiPayment.isPending || createCodPayment.isPending}
              >
                {paymentMethod === "COD"
                  ? "Place Order (COD)"
                  : `Place Order (UPI - ₹${finalTotal.toFixed(2)})`}
              </Button>
            </form>
          </section>

          <section className="mt-16 rounded-2xl bg-surface p-6 sm:p-8 lg:col-span-5 lg:mt-0 border border-border">
            <h2 className="text-2xl font-serif text-text-primary mb-6">Order Summary</h2>

            <div className="divide-y divide-border max-h-80 overflow-y-auto mb-6 pr-1">
              {items.map((item: any) => (
                <div key={item.id} className="py-4 flex gap-4">
                  {item.variant?.product?.images?.[0]?.url ? (
                    <img
                      src={encodeURI(item.variant.product.images[0].url)}
                      alt={item.variant?.product?.name}
                      className="w-16 h-16 rounded-xl object-cover bg-muted flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-text-secondary font-serif text-[10px] text-center p-1 flex-shrink-0">
                      {item.variant?.product?.name}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-base text-text-primary truncate">{item.variant?.product?.name}</h4>
                    <p className="text-xs text-text-secondary font-light">{item.variant?.name} × {item.quantity}</p>
                    {item.customization && (
                      <div className="mt-1 rounded bg-muted/60 p-2 text-[11px] text-text-secondary border border-border">
                        <span className="font-semibold block text-text-primary text-[9px] uppercase tracking-wider">Customization</span>
                        <p className="whitespace-pre-wrap font-light">{item.customization}</p>
                      </div>
                    )}
                    <p className="text-sm font-medium text-text-primary mt-1">₹{(parseFloat(item.variant?.price?.toString() || "0") * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="border-t border-border pt-6 mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent" /> Promo Code / Coupon
              </h3>

              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input
                    placeholder="Enter code (e.g. SAVE10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="rounded-xl text-sm"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={validateCoupon.isPending || !couponInput.trim()}
                    className="rounded-xl px-4 shrink-0"
                  >
                    {validateCoupon.isPending ? "Validating..." : "Apply"}
                  </Button>
                </form>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    <div>
                      <p className="text-xs font-bold text-accent">{appliedCoupon.code}</p>
                      <p className="text-[11px] text-text-secondary">₹{appliedCoupon.discountAmount.toFixed(2)} discount applied</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-text-secondary hover:text-text-primary p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
            </div>

            <dl className="space-y-4 text-sm text-text-secondary font-light border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <dt>Subtotal</dt>
                <dd className="font-medium text-text-primary">₹{subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex flex-col">
                  <span>Shipping</span>
                  {estimatedDeliveryDays && (
                    <span className="text-[11px] text-text-secondary font-light">({estimatedDeliveryDays})</span>
                  )}
                </dt>
                <dd className="font-medium text-text-primary">
                  {shipping === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : `₹${shipping.toFixed(2)}`}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{taxLabel}</dt>
                <dd className="font-medium text-text-primary">₹{tax.toFixed(2)}</dd>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-accent font-medium">
                  <dt>Discount ({appliedCoupon.code})</dt>
                  <dd>-₹{discount.toFixed(2)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-4 text-base font-medium text-text-primary">
                <dt>Total Amount</dt>
                <dd className="text-2xl font-serif text-accent">₹{finalTotal.toFixed(2)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-serif text-text-primary">Checkout</h1>
          <div className="mt-12 h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
