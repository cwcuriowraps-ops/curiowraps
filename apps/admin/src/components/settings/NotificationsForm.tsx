"use client";

import { Button, Card, CardHeader, CardTitle, CardContent } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateSettings } from "../../api/settings";


const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  newOrders: z.boolean(),
  lowStockAlerts: z.boolean(),
  customerReviews: z.boolean(),
  supportMessages: z.boolean(),
  systemUpdates: z.boolean(),
});

type NotificationsValues = z.infer<typeof notificationsSchema>;

export function NotificationsForm({ defaultValues }: { defaultValues: any }) {
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const form = useForm<NotificationsValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: defaultValues?.notifications?.emailNotifications ?? true,
      newOrders: defaultValues?.notifications?.newOrders ?? true,
      lowStockAlerts: defaultValues?.notifications?.lowStockAlerts ?? true,
      customerReviews: defaultValues?.notifications?.customerReviews ?? false,
      supportMessages: defaultValues?.notifications?.supportMessages ?? true,
      systemUpdates: defaultValues?.notifications?.systemUpdates ?? true,
    },
  });

  useEffect(() => {
    if (defaultValues?.notifications) {
      form.reset(defaultValues.notifications);
    }
  }, [defaultValues, form]);

  const onSubmit = (data: NotificationsValues) => {
    updateSettings({ notifications: data });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h4 className="font-medium text-text-primary">Enable Email Notifications</h4>
              <p className="text-sm text-text-secondary">Master switch for all admin email alerts.</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded border-border text-accent focus:ring-accent" {...form.register("emailNotifications")} />
          </div>
          
          <div className="space-y-4 pt-2">
            {[
              { id: "newOrders", label: "New Orders", desc: "Get notified when a customer places an order" },
              { id: "lowStockAlerts", label: "Low Stock Alerts", desc: "Get notified when product inventory falls below threshold" },
              { id: "customerReviews", label: "Customer Reviews", desc: "Get notified when a new review is posted" },
              { id: "supportMessages", label: "Support Messages", desc: "Get notified when a customer sends a message" },
              { id: "systemUpdates", label: "System Updates", desc: "Important updates about the platform" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-text-primary">{item.label}</h4>
                  <p className="text-sm text-text-secondary">{item.desc}</p>
                </div>
                <input type="checkbox" className="h-4 w-4 rounded border-border text-accent focus:ring-accent" disabled={!form.watch("emailNotifications")} {...form.register(item.id as any)} />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
