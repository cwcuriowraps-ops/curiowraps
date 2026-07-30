"use client";

import { Button, useToast } from "@dashboard/ui";
import { useState } from "react";

import { apiClient } from "@/lib/api-client";

export default function ContactPage() {
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      addToast({
        title: "Incomplete Form",
        description: "Please fill out all required fields (Name, Email, and Message).",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient<{ success: boolean; message: string }>("/contact", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject: subject.trim() || undefined,
          message: message.trim(),
        }),
      });

      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");

      addToast({
        title: "Message Sent! ✨",
        description: response.message || "Thank you for reaching out. We will get back to you as soon as possible.",
        type: "success",
      });
    } catch (error: any) {
      addToast({
        title: "Failed to send message",
        description: error.message || "An unexpected error occurred. Please try again later.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-4xl font-serif text-text-primary">Contact Us</h1>
          <p className="text-text-secondary font-light max-w-lg mx-auto leading-relaxed">
            For assistance, DM us on Instagram or fill out the contact form below. We&apos;ll get back to you as soon as possible.
          </p>

          {/* Support Channels CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 max-w-xl mx-auto">
            {/* Prominent Instagram DM CTA */}
            <a
              href="https://www.instagram.com/curio.wraps/"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-accent text-white font-medium shadow-md hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>DM us on Instagram (@curio.wraps)</span>
            </a>

            {/* Email Contact (Relocated from Footer) */}
            <a
              href="mailto:cw.curiowraps@gmail.com"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface border border-border text-text-primary hover:border-accent hover:text-accent font-medium transition-all text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>cw.curiowraps@gmail.com</span>
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full border-border border rounded-xl h-12 px-4 bg-background text-text-primary placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent focus:border-accent transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-primary">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full border-border border rounded-xl h-12 px-4 bg-background text-text-primary placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent focus:border-accent transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-primary">
                Phone Number <span className="text-text-secondary font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border-border border rounded-xl h-12 px-4 bg-background text-text-primary placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent focus:border-accent transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">
              Subject <span className="text-text-secondary font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Custom Gift Inquiry, Order Status, Bulk Inquiry"
              className="w-full border-border border rounded-xl h-12 px-4 bg-background text-text-primary placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent focus:border-accent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help you?"
              className="w-full border-border border rounded-xl p-4 bg-background text-text-primary placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent focus:border-accent transition-all outline-none"
            />
          </div>

          <div className="flex justify-center pt-2">
            <Button
              type="submit"
              size="lg"
              width="action"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="shadow-sm hover:shadow-md transition-all"
            >
              Send Message
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}