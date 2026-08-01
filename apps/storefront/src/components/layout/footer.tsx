import { Logo } from "@dashboard/ui";
import Link from "next/link";

const footerLinks = {
  company: [
    { href: "/categories", label: "Categories" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms & Conditions" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/">
              <Logo size={80} className="-ml-6" />
            </Link>
            <p className="mt-4 text-text-secondary max-w-sm">
              Handcrafted pipe cleaner creations made with love. Perfect gifts that bring smiles to everyday life.
            </p>
            <div className="mt-6">
              <a href="https://www.instagram.com/curio.wraps/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span className="text-sm">@curio.wraps</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wider text-text-primary uppercase">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-secondary transition-colors duration-normal hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wider text-text-primary uppercase">Policies</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-secondary transition-colors duration-normal hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex justify-center items-center text-center">
          <p className="text-sm text-text-secondary">
            &copy; {new Date().getFullYear()} Curio Wrap. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
