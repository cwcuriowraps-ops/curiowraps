"use client";

import { Logo } from "@dashboard/ui";
import {
  LayoutDashboard,
  ShoppingBag,
  Tags,
  Image as ImageIcon,
  Users,
  Settings,
  Ticket,
  PackageSearch,
  ShoppingCart,
  Layers,
  Star,
  MonitorPlay,
  BarChart3,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useUnreadContactMessagesCount } from "@/api/contact";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inbox", href: "/inbox", icon: Inbox, showBadge: true },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: ShoppingBag },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Collections", href: "/collections", icon: Layers },
  { name: "Media Library", href: "/media", icon: ImageIcon },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Coupons", href: "/coupons", icon: Ticket },
  { name: "Homepage CMS", href: "/cms", icon: MonitorPlay },
  { name: "Inventory", href: "/inventory", icon: PackageSearch },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: unreadCount } = useUnreadContactMessagesCount();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-surface">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center px-2">
          <Logo size={45} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const hasUnread = item.showBadge && unreadCount && unreadCount > 0;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-text-primary text-background shadow-sm"
                  : "text-text-secondary hover:bg-muted hover:text-text-primary"
              }`}
            >
              <div className="flex items-center">
                <item.icon
                  className={`mr-3 h-5 w-5 shrink-0 transition-colors ${
                    isActive ? "text-background" : "text-text-secondary group-hover:text-text-primary"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </div>

              {hasUnread ? (
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive ? "bg-background text-text-primary" : "bg-accent text-white shadow-sm"
                  }`}
                >
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
