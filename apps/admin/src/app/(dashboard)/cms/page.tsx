"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Skeleton, useToast } from "@dashboard/ui";
import { Save } from "lucide-react";
import { useState, useEffect } from "react";

import { useSettings, useUpdateSettings } from "@/api/settings";

export default function CMSPage() {
  const { addToast } = useToast();
  const { data: settingsData, isLoading } = useSettings();
  const { mutateAsync: updateSettings, isPending: isSaving } = useUpdateSettings();

  const [announcementText, setAnnouncementText] = useState("Free shipping on all Curio Wrap orders over ₹1,000!");
  const [announcementLink, setAnnouncementLink] = useState("/products");
  const [announcementActive, setAnnouncementActive] = useState(true);

  useEffect(() => {
    if (settingsData?.announcement) {
      setAnnouncementText(settingsData.announcement.text ?? "Free shipping on all Curio Wrap orders over ₹1,000!");
      setAnnouncementLink(settingsData.announcement.link ?? "/products");
      setAnnouncementActive(settingsData.announcement.active ?? true);
    }
  }, [settingsData]);

  const handleSave = async () => {
    try {
      await updateSettings({
        announcement: {
          text: announcementText,
          link: announcementLink,
          active: announcementActive,
        },
      });
      addToast({ title: "Settings saved", description: "Announcement bar & CMS settings updated.", type: "success" });
    } catch (err: any) {
      addToast({ title: "Failed to save settings", description: err.message, type: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">CMS & Storefront</h1>
          <p className="text-sm text-text-secondary">Manage storefront content and layout</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Announcement Bar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Announcement Text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
            />
            <Input
              label="Link (optional)"
              value={announcementLink}
              onChange={(e) => setAnnouncementLink(e.target.value)}
            />
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="enableAnnouncements"
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
              />
              <label htmlFor="enableAnnouncements" className="ml-2 block text-sm text-text-primary cursor-pointer">
                Enable Announcement Bar
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Headline" defaultValue="Handcrafted with Love" />
            <Input label="Subheadline" defaultValue="Cute, elegant, and minimal pipe cleaner creations for every occasion." />
            <Input label="Button Text" defaultValue="Shop Now" />
            <Input label="Button Link" defaultValue="/collections/all" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
