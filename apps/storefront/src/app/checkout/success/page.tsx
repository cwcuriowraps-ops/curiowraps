"use client";

import { Button } from "@dashboard/ui";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 px-4">
      <CheckCircle2 className="h-24 w-24 text-green-500 mb-8" />
      <h1 className="text-4xl font-bold text-text-primary text-center mb-4">Payment Successful!</h1>
      <p className="text-lg text-text-secondary text-center mb-8 max-w-md">
        Thank you for your purchase. We have received your order and are currently processing it.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push("/account")}>
          View Orders
        </Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
