import fs from 'fs';
import path from 'path';

// Define complex page templates for Commerce & Static Pages

const CATEGORIES_PAGE = `
"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

export default function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-categories"],
    queryFn: () => apiClient<any>("/categories")
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-text-primary">All Categories</h1>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data?.categories?.map((c: any) => (
            <Link key={c.id} href={\`/products?category=\${c.slug}\`} className="group relative rounded-lg overflow-hidden block">
              <div className="aspect-square bg-muted">
                <img src={c.images?.[0]?.url || "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop"} alt={c.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white">{c.name}</h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
`;

const BRANDS_PAGE = `
"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

export default function BrandsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-brands"],
    queryFn: () => apiClient<any>("/brands")
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-text-primary">Featured Brands</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {data?.brands?.map((b: any) => (
            <Link key={b.id} href={\`/products?brand=\${b.slug}\`} className="flex items-center justify-center p-6 border border-border rounded-lg hover:border-primary transition-colors bg-surface">
              <h3 className="text-lg font-bold text-text-primary">{b.name}</h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
`;

const SEARCH_PAGE = `
"use client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => apiClient<any>(\`/search?q=\${encodeURIComponent(query)}\`),
    enabled: !!query
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 text-text-primary">Search Results for "{query}"</h1>
      {!query && <p className="text-text-secondary">Please enter a search term.</p>}
      
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />)}
        </div>
      )}

      {data?.results?.length === 0 && (
        <div className="py-12 text-center text-text-secondary">
          No products found matching your search.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {data?.results?.map((p: any) => (
          <Link key={p.id} href={\`/products/\${p.slug}\`} className="group cursor-pointer">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-text-primary">{p.name}</h3>
              <p className="mt-1 font-bold text-text-primary">₹{p.basePrice}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
`;

const WISHLIST_PAGE = `
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Button } from "@dashboard/ui";

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => apiClient<any>("/wishlist")
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => apiClient.delete(\`/wishlist/\${productId}\`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] })
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-text-primary">My Wishlist</h1>
      {isLoading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-lg border border-border">
          <p className="text-text-secondary text-lg">Your wishlist is empty.</p>
          <Link href="/products"><Button className="mt-4">Continue Shopping</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.items?.map((item: any) => (
            <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg bg-surface relative">
              <img src={item.product.images?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop"} alt={item.product.name} className="w-24 h-24 object-cover rounded bg-muted" />
              <div className="flex-1">
                <Link href={\`/products/\${item.product.slug}\`} className="font-bold text-text-primary hover:underline">{item.product.name}</Link>
                <p className="text-sm text-text-secondary">₹{item.product.basePrice}</p>
                <Button size="sm" variant="outline" className="mt-2 text-red-500 border-red-200 hover:bg-red-50" onClick={() => removeMutation.mutate(item.productId)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

const COLLECTIONS_PAGE = `
"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

export default function CollectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: () => apiClient<any>("/categories?featured=true")
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-4 text-text-primary">Curated Collections</h1>
      <p className="text-text-secondary mb-12 max-w-2xl">Discover our hand-picked selections of premium products designed for modern lifestyles.</p>
      
      {isLoading ? (
        <div className="space-y-12">
          {[1,2].map(i => <div key={i} className="h-96 w-full bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-12">
          {data?.categories?.map((c: any, i: number) => (
            <div key={c.id} className={\`flex flex-col \${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center\`}>
              <div className="w-full md:w-1/2">
                <img src={c.images?.[0]?.url || "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop"} alt={c.name} className="rounded-lg shadow-lg w-full h-[400px] object-cover" />
              </div>
              <div className="w-full md:w-1/2 p-8">
                <h2 className="text-3xl font-bold mb-4 text-text-primary">{c.name} Collection</h2>
                <p className="text-text-secondary mb-6 text-lg">{c.description || "Explore our exclusive range of meticulously crafted pieces."}</p>
                <Link href={\`/products?category=\${c.slug}\`} className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                  Shop Collection
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

const STATIC_ABOUT = `
export const metadata = { title: "About Us | Curio Wrap" };
export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-text-primary">About Curio Wrap</h1>
      <div className="prose prose-lg text-text-secondary">
        <p>Founded in 2026, Curio Wrap is the premier destination for curated luxury goods. We believe in quality, craftsmanship, and timeless elegance.</p>
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop" alt="Store" className="rounded-lg my-8 w-full object-cover h-64" />
        <h2>Our Mission</h2>
        <p>To provide our customers with an unparalleled shopping experience, offering products that are not just items, but heirlooms.</p>
        <h2>Sustainability</h2>
        <p>We are committed to ethical sourcing and sustainable practices across our entire supply chain. Luxury should not come at the cost of our planet.</p>
      </div>
    </div>
  );
}
`;

const STATIC_FAQ = `
export const metadata = { title: "FAQ | Curio Wrap" };
export default function FAQPage() {
  const faqs = [
    { q: "What is your return policy?", a: "We offer a 30-day hassle-free return policy for all unworn and unused items in their original packaging." },
    { q: "Do you ship internationally?", a: "Yes, we ship to over 100 countries worldwide via premium logistics partners." },
    { q: "How can I track my order?", a: "Once your order is dispatched, you will receive a tracking link via email and SMS." },
    { q: "Are your products authentic?", a: "100%. We source directly from brands and authorized distributors." },
  ];
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8 text-text-primary">Frequently Asked Questions</h1>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-border rounded-lg p-6 bg-surface">
            <h3 className="text-xl font-bold text-text-primary mb-2">{faq.q}</h3>
            <p className="text-text-secondary">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

const STATIC_CONTACT = `
export const metadata = { title: "Contact Us | Curio Wrap" };
export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8 text-text-primary">Contact Us</h1>
      <p className="text-text-secondary mb-8">We'd love to hear from you. Please fill out the form below and our team will get back to you within 24 hours.</p>
      <form className="space-y-6 bg-surface p-8 rounded-lg border border-border">
        <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" className="w-full border rounded-lg h-12 px-4 bg-background" /></div>
        <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" className="w-full border rounded-lg h-12 px-4 bg-background" /></div>
        <div><label className="block text-sm font-medium mb-1">Message</label><textarea className="w-full border rounded-lg p-4 bg-background h-32" /></div>
        <button type="button" className="w-full bg-primary text-primary-foreground h-12 rounded-lg font-medium">Send Message</button>
      </form>
    </div>
  );
}
`;

const STATIC_TERMS = `
export const metadata = { title: "Terms & Conditions | Curio Wrap" };
export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-text-primary">Terms & Conditions</h1>
      <div className="prose prose-lg text-text-secondary">
        <p>Last updated: July 2026</p>
        <h2>1. Agreement to Terms</h2>
        <p>By accessing our website, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
        <h2>2. Intellectual Property</h2>
        <p>The materials contained in this website are protected by applicable copyright and trademark law.</p>
        <h2>3. Limitations</h2>
        <p>In no event shall Curio Wrap or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.</p>
      </div>
    </div>
  );
}
`;

const STATIC_PRIVACY = `
export const metadata = { title: "Privacy Policy | Curio Wrap" };
export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-text-primary">Privacy Policy</h1>
      <div className="prose prose-lg text-text-secondary">
        <p>Last updated: July 2026</p>
        <h2>Information We Collect</h2>
        <p>We collect information you provide directly to us when you create an account, make a purchase, or communicate with us.</p>
        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and send you technical notices.</p>
        <h2>Data Security</h2>
        <p>We implement appropriate technical and organizational security measures designed to protect your personal information.</p>
      </div>
    </div>
  );
}
`;

const ADMIN_ANALYTICS = `
"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export default function AnalyticsPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders-analytics"],
    queryFn: () => apiClient<any>("/admin/orders")
  });

  const totalRevenue = orders?.orders?.reduce((acc: number, o: any) => acc + Number(o.total), 0) || 0;
  const totalOrders = orders?.orders?.length || 0;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-text-primary">Analytics Dashboard</h1>
      {isLoading ? (
        <div className="animate-pulse h-32 bg-muted rounded-lg w-full max-w-3xl" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-text-primary">₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-text-primary">{totalOrders}</p>
          </div>
        </div>
      )}
    </div>
  );
}
`;

const ADMIN_USERS = `
"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiClient<any>("/admin/users")
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-text-primary">User Management</h1>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {isLoading ? (
           <div className="p-8 animate-pulse h-64 bg-muted" />
        ) : (
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="bg-muted/50 text-text-primary uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium text-text-primary">{u.firstName} {u.lastName}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">{u.role}</span></td>
                  <td className="px-6 py-4">{u.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
`;

const ADMIN_ROLES = `
export default function RolesPage() {
  const roles = [
    { name: "SUPERADMIN", desc: "Full access to all system features and user management." },
    { name: "ADMIN", desc: "Access to store operations (Products, Orders, Inventory)." },
    { name: "MANAGER", desc: "Access to view orders and manage catalog, cannot edit settings." },
    { name: "CUSTOMER", desc: "Standard shopper access to storefront." }
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-text-primary">Roles & Permissions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map(r => (
          <div key={r.name} className="p-6 bg-surface border border-border rounded-lg">
            <h3 className="text-xl font-bold text-primary mb-2">{r.name}</h3>
            <p className="text-text-secondary">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

function writePage(relPath: string, content: string) {
  const file = path.join(process.cwd(), relPath);
  fs.writeFileSync(file, content.trim());
  console.log(`Updated ${file}`);
}

writePage('apps/storefront/src/app/categories/page.tsx', CATEGORIES_PAGE);
writePage('apps/storefront/src/app/brands/page.tsx', BRANDS_PAGE);
writePage('apps/storefront/src/app/search/page.tsx', SEARCH_PAGE);
writePage('apps/storefront/src/app/wishlist/page.tsx', WISHLIST_PAGE);
writePage('apps/storefront/src/app/collections/page.tsx', COLLECTIONS_PAGE);
writePage('apps/storefront/src/app/about/page.tsx', STATIC_ABOUT);
writePage('apps/storefront/src/app/contact/page.tsx', STATIC_CONTACT);
writePage('apps/storefront/src/app/faq/page.tsx', STATIC_FAQ);
writePage('apps/storefront/src/app/terms/page.tsx', STATIC_TERMS);
writePage('apps/storefront/src/app/privacy/page.tsx', STATIC_PRIVACY);

writePage('apps/admin/src/app/(dashboard)/analytics/page.tsx', ADMIN_ANALYTICS);
writePage('apps/admin/src/app/(dashboard)/users/page.tsx', ADMIN_USERS);
writePage('apps/admin/src/app/(dashboard)/roles/page.tsx', ADMIN_ROLES);
