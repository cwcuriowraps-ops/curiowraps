import fs from 'fs';
import path from 'path';

const storefrontPages = [
  { path: 'about', title: 'About Us' },
  { path: 'contact', title: 'Contact Us' },
  { path: 'faq', title: 'Frequently Asked Questions' },
  { path: 'terms', title: 'Terms & Conditions' },
  { path: 'privacy', title: 'Privacy Policy' },
  { path: 'wishlist', title: 'My Wishlist' },
  { path: 'categories', title: 'All Categories' },
  { path: 'collections', title: 'Collections' },
  { path: 'brands', title: 'Brands' },
  { path: 'search', title: 'Search Results' }
];

const adminPages = [
  { path: 'media', title: 'Media Library' },
  { path: 'analytics', title: 'Analytics' },
  { path: 'settings', title: 'Settings' },
  { path: 'users', title: 'Users' },
  { path: 'roles', title: 'Roles & Permissions' },
  { path: 'cms', title: 'CMS Configuration' }
];

function scaffold(basePath: string, pages: { path: string, title: string }[]) {
  for (const page of pages) {
    const dir = path.join(process.cwd(), basePath, page.path);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const file = path.join(dir, 'page.tsx');
    if (!fs.existsSync(file)) {
      const content = `
export const metadata = {
  title: "${page.title} | Curio Wrap",
  description: "${page.title} page for Curio Wrap"
};

export default async function Page() {
  // TODO: Connect to backend CMS/Catalog APIs
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">${page.title}</h1>
      <p className="text-gray-600">This page is under construction and will be hydrated with real API data.</p>
    </div>
  );
}
`;
      fs.writeFileSync(file, content.trim());
      console.log(`Created ${file}`);
    }
  }
}

scaffold('apps/storefront/src/app', storefrontPages);
scaffold('apps/admin/src/app/(dashboard)', adminPages);
