"use client";

import { Skeleton } from "@dashboard/ui";
import { User, Store, Mail, CreditCard, Shield, Truck, Search, HardDrive, AtSign, Percent } from "lucide-react";
import { useState } from "react";

import { useSettings } from "@/api/settings";
import { BackupSystemPanel } from "@/components/settings/BackupSystemPanel";
import { BrandingForm } from "@/components/settings/BrandingForm";
import { EmailSettingsForm } from "@/components/settings/EmailSettingsForm";
import { NotificationsForm } from "@/components/settings/NotificationsForm";
import { PaymentForm } from "@/components/settings/PaymentForm";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { SeoForm } from "@/components/settings/SeoForm";
import { ShippingForm } from "@/components/settings/ShippingForm";
import { StoreInfoForm } from "@/components/settings/StoreInfoForm";
import { TaxesForm } from "@/components/settings/TaxesForm";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { data: settings, isLoading } = useSettings();

  const tabs = [
    { id: "profile", label: "Admin Profile", icon: User },
    { id: "email", label: "Email Management", icon: AtSign },
    { id: "store", label: "Store Information", icon: Store },
    { id: "branding", label: "Store Branding", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Mail },
    { id: "payments", label: "Payment Settings", icon: CreditCard },
    { id: "shipping", label: "Shipping Settings", icon: Truck },
    { id: "taxes", label: "Tax Settings", icon: Percent },
    { id: "seo", label: "SEO Settings", icon: Search },
    { id: "system", label: "Backup & System", icon: HardDrive },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your store configurations and profile</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-64 flex-shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:bg-muted hover:text-text-primary"
              }`}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-white" : "text-text-secondary"}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === "profile" && <ProfileForm />}
              {activeTab === "email" && <EmailSettingsForm />}
              {activeTab === "store" && <StoreInfoForm defaultValues={settings} />}
              {activeTab === "branding" && <BrandingForm defaultValues={settings} />}
              {activeTab === "notifications" && <NotificationsForm defaultValues={settings} />}
              {activeTab === "payments" && <PaymentForm defaultValues={settings} />}
              {activeTab === "shipping" && <ShippingForm defaultValues={settings} />}
              {activeTab === "taxes" && <TaxesForm defaultValues={settings} />}
              {activeTab === "seo" && <SeoForm defaultValues={settings} />}
              {activeTab === "system" && <BackupSystemPanel />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
