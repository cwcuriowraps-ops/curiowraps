import type { Metadata } from "next";

import { FAQAccordion } from "@/components/faq/FAQAccordion";
import { FAQS } from "@/data/faqs";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | Curio Wrap",
  description:
    "Find answers to common questions about Curio Wrap products, custom colors, personalized gift messages, payment options, COD, shipping, and bulk orders.",
};

export default function FAQPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      {/* Schema.org FAQPage Structured Data for Google Search SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-background min-h-[80vh] py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
              Help Center
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-text-primary tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-base sm:text-lg text-text-secondary font-light max-w-2xl mx-auto leading-relaxed">
              Have questions about our handmade creations, custom orders, or delivery? We&apos;ve got all your answers right here.
            </p>
          </div>

          {/* Interactive Accordion Section */}
          <FAQAccordion />
        </div>
      </div>
    </>
  );
}