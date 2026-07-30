"use client";

import { Skeleton } from "@dashboard/ui";
import { useParams } from "next/navigation";

import { useAdminProduct } from "@/api/products";
import { ProductForm } from "@/components/products/product-form";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useAdminProduct(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-96 max-w-3xl rounded-xl" />
      </div>
    );
  }

  if (!data?.data?.product) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-secondary">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Edit Product</h1>
        <p className="text-sm text-text-secondary">Update details for {data.data.product.name}</p>
      </div>
      <ProductForm initialData={data.data.product} />
    </div>
  );
}
