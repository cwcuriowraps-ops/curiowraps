"use client";

import { Button } from "@dashboard/ui";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 px-4">
      <CheckCircle2 className="h-24 w-24 text-emerald-500 mb-8" />
      <h1 className="text-4xl font-serif font-bold text-text-primary text-center mb-4">Order Received! 🎉</h1>
      <p className="text-lg text-text-secondary text-center mb-8 max-w-md font-light">
        Thank you for your purchase. We have received your order! For UPI payments, our team will verify the transaction and update your order status.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push("/account/orders")} className="rounded-full px-6">
          View My Orders
        </Button>
        <Button variant="outline" onClick={() => router.push("/products")} className="rounded-full px-6">
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
