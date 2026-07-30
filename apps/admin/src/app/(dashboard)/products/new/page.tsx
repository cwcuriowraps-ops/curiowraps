import { ProductForm } from "@/components/products/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Add Product</h1>
        <p className="text-sm text-text-secondary">Create a new product in your catalog</p>
      </div>
      <ProductForm />
    </div>
  );
}
