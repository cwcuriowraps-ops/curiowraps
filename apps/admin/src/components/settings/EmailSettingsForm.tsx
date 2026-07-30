"use client";

import { Button, Card, CardHeader, CardTitle, CardContent, Input, Skeleton } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useEmailSettings, useUpdateEmailSettings, useSendTestEmail } from "../../api/settings";
import { useAuthStore } from "../../store/useAuthStore";

const emailSettingsSchema = z.object({
  senderName: z.string().min(1, "Sender Name is required."),
  senderEmail: z.string().email("A valid email address is required."),
  replyToEmail: z.string().email("Reply-To must be a valid email address.").or(z.literal("")),
});

type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;

export function EmailSettingsForm() {
  const { user } = useAuthStore();
  const { data: emailSettings, isLoading } = useEmailSettings();
  const { mutate: updateEmailSettings, isPending: isSaving } = useUpdateEmailSettings();
  const { mutate: sendTestEmail, isPending: isSendingTest } = useSendTestEmail();

  const form = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      senderName: "",
      senderEmail: "",
      replyToEmail: "",
    },
  });

  useEffect(() => {
    if (emailSettings) {
      form.reset({
        senderName: emailSettings.senderName || "Curio Wraps",
        senderEmail: emailSettings.senderEmail || "cw.curiowraps@gmail.com",
        replyToEmail: emailSettings.replyToEmail || "",
      });
    }
  }, [emailSettings, form]);

  const onSubmit = (values: EmailSettingsValues) => {
    updateEmailSettings(values);
  };

  const handleSendTestEmail = () => {
    sendTestEmail(user?.email);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isDirty = form.formState.isDirty;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" />
              Email Sender Configuration
            </CardTitle>
            <p className="text-xs text-text-secondary mt-1">
              Configure the sender details used for all outgoing transactional emails (Forgot Password, Welcome, Orders). Changes apply immediately without server restart.
            </p>
          </div>
          {isDirty && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full text-xs font-medium animate-pulse">
              <AlertCircle className="h-3.5 w-3.5" />
              Unsaved Changes
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          {/* Sender Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              Sender Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Curio Wraps Store"
              {...form.register("senderName")}
              className="max-w-xl"
            />
            {form.formState.errors.senderName && (
              <p className="text-xs text-red-500">{form.formState.errors.senderName.message}</p>
            )}
            <p className="text-xs text-text-secondary">
              The display name recipients will see in their email inbox (e.g. &quot;Curio Wraps Store&quot;).
            </p>
          </div>

          {/* Sender Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              Sender Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="e.g. cw.curiowraps@gmail.com"
              {...form.register("senderEmail")}
              className="max-w-xl"
            />
            {form.formState.errors.senderEmail && (
              <p className="text-xs text-red-500">{form.formState.errors.senderEmail.message}</p>
            )}
            <p className="text-xs text-text-secondary">
              The authorized email address used as the From header. Must be a verified sender in Brevo.
            </p>
          </div>

          {/* Reply-To Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              Reply-To Email Address <span className="text-text-secondary font-normal">(Optional)</span>
            </label>
            <Input
              type="email"
              placeholder="e.g. support@curiowraps.com"
              {...form.register("replyToEmail")}
              className="max-w-xl"
            />
            {form.formState.errors.replyToEmail && (
              <p className="text-xs text-red-500">{form.formState.errors.replyToEmail.message}</p>
            )}
            <p className="text-xs text-text-secondary">
              Optional address where customer replies will be directed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSendTestEmail}
              disabled={isSendingTest || isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSendingTest ? "Sending Test Email..." : "Send Test Email"}
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => form.reset()}
                  disabled={isSaving}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  Discard Changes
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSaving || (!isDirty && !form.formState.isSubmitting)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 min-w-[140px]"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
