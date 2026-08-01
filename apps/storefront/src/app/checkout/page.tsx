"use client";

import { Button, Input, useToast } from "@dashboard/ui";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useCart } from "@/api/cart";
import { useValidateCoupon } from "@/api/coupons";
import { useCreateOrder } from "@/api/orders";
import { useCreateCodPayment, useCreateRazorpayOrder, useVerifyRazorpayPayment } from "@/api/payments";
import { useAuthStore } from "@/store/useAuthStore";

export default function CheckoutPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useCart();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  const createOrder = useCreateOrder();
  const createRazorpayOrder = useCreateRazorpayOrder();
  const verifyRazorpayPayment = useVerifyRazorpayPayment();
  const createCodPayment = useCreateCodPayment();
  const validateCoupon = useValidateCoupon();

  const { register, handleSubmit } = useForm();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/checkout");
    }
  }, [user, router]);

  if (!user || isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif text-text-primary">Checkout</h1>
        <div className="mt-12 h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  const cart = data?.cart;
  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center py-32 text-center">
        <h1 className="text-4xl font-serif text-text-primary mb-6">Your cart is empty</h1>
        <Button onClick={() => router.push("/products")} size="lg" className="rounded-full px-8">Continue Shopping</Button>
      </div>
    );
  }

  const subtotal = cart.totals?.subtotal ?? 0;
  const shipping = cart.totals?.shipping ?? 0;
  const tax = cart.totals?.tax ?? 0;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = Math.max(0, subtotal + shipping + tax - discount);

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
        addToast({ title: "Coupon Error", description: errMsg, type: "error" });
      }
    } catch (err: any) {
      const errMsg = err.message || "Failed to validate coupon";
      setCouponError(errMsg);
      addToast({ title: "Coupon Error", description: errMsg, type: "error" });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    addToast({ title: "Coupon Removed", description: "The coupon discount has been removed.", type: "info" });
  };

  const onSubmit = async (values: Record<string, string>) => {
    try {
      const shippingAddress = {
        firstName: values.firstName?.trim() || "",
        lastName: values.lastName?.trim() || "",
        line1: values.address?.trim() || "",
        city: values.city?.trim() || "",
        postalCode: values.postalCode?.trim() || "",
      };

      if (Object.values(shippingAddress).some((value) => !value)) {
        addToast({ title: "Incomplete Address", description: "Please complete all shipping address fields.", type: "warning" });
        return;
      }

      // 1. Create the order
      const orderResult = await createOrder.mutateAsync({
        paymentMethod,
        shippingAddress,
        couponCode: appliedCoupon?.code || undefined,
        notes: "Created from Storefront Checkout",
      });
      const order = orderResult.order || orderResult;

      if (paymentMethod === "COD") {
        // 2. COD flow
        await createCodPayment.mutateAsync(order.id);
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        addToast({
          title: "Order Placed Successfully! 🎉",
          description: "Thank you for your order. We will process it shortly.",
          type: "success",
        });
        router.push("/checkout/success");
      } else {
        // 2. Razorpay flow
        const rzpPayment = await createRazorpayOrder.mutateAsync(order.id);

        if (!(window as any).Razorpay) {
          throw new Error("Payment service is still loading. Please try again.");
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
          amount: Number(rzpPayment.amount) * 100,
          currency: rzpPayment.currency,
          name: "Curio Wrap",
          description: `Order #${order.orderNumber || order.id.slice(0, 8)}`,
          order_id: rzpPayment.providerOrderId,
          handler: async function (response: any) {
            try {
              await verifyRazorpayPayment.mutateAsync({
                razorpay_order_id: response.razorpay_order_id || rzpPayment.providerOrderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              queryClient.invalidateQueries({ queryKey: ["cart"] });
              addToast({
                title: "Payment Successful! 🎉",
                description: "Your payment was processed and order confirmed.",
                type: "success",
              });
              router.push("/checkout/success");
            } catch {
              addToast({
                title: "Payment Verification Failed",
                description: "Please check your account or contact support.",
                type: "error",
              });
              router.push("/checkout/failure");
            }
          },
          prefill: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
          },
          theme: {
            color: "#f7c8d8",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function () {
          addToast({
            title: "Payment Failed",
            description: "Payment was declined or cancelled.",
            type: "error",
          });
          router.push("/checkout/failure");
        });
        rzp.open();
      }
    } catch (error: any) {
      console.error("Checkout failed:", error);
      addToast({
        title: "Checkout Failed",
        description: error.message || "Failed to initiate checkout. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <>
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
                      className={`border p-6 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'RAZORPAY' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border hover:border-accent/50'}`}
                      onClick={() => setPaymentMethod('RAZORPAY')}
                    >
                      <span className="font-medium text-text-primary block mb-1">Online Payment</span>
                      <span className="text-sm text-text-secondary font-light">Credit Card, UPI, Netbanking</span>
                    </div>
                    <div
                      className={`border p-6 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border hover:border-accent/50'}`}
                      onClick={() => setPaymentMethod('COD')}
                    >
                      <span className="font-medium text-text-primary block mb-1">Cash on Delivery</span>
                      <span className="text-sm text-text-secondary font-light">Pay when your order arrives</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full shadow-md hover:shadow-lg transition-shadow rounded-full"
                  disabled={createOrder.isPending || createRazorpayOrder.isPending || createCodPayment.isPending}
                >
                  {createOrder.isPending || createRazorpayOrder.isPending || createCodPayment.isPending
                    ? "Processing Order..."
                    : paymentMethod === 'COD' ? "Place Order (COD)" : `Pay ₹${finalTotal.toFixed(2)}`}
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
                    {cart.totals?.estimatedDeliveryDays && (
                      <span className="text-[11px] text-text-secondary font-light">({cart.totals.estimatedDeliveryDays})</span>
                    )}
                  </dt>
                  <dd className="font-medium text-text-primary">
                    {shipping === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : `₹${shipping.toFixed(2)}`}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>{cart.totals?.taxLabel || "Tax"}</dt>
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    </>
  );
}
