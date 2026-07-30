"use client";

import { Button } from "@dashboard/ui";
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckoutFailurePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 px-4">
      <XCircle className="h-24 w-24 text-red-500 mb-8" />
      <h1 className="text-4xl font-bold text-text-primary text-center mb-4">Payment Failed</h1>
      <p className="text-lg text-text-secondary text-center mb-8 max-w-md">
        Unfortunately, your payment could not be processed. Please try again or use a different payment method.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push("/checkout")}>
          Try Again
        </Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Return to Home
        </Button>
      </div>
    </div>
  );
}
