"use client";

import { ChevronDown, Search, X, HelpCircle, Sparkles, ShoppingBag, CreditCard, Headphones, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

import { FAQS, FAQ_CATEGORIES, FAQItem } from "@/data/faqs";

export function FAQAccordion() {
  const [expandedId, setExpandedId] = useState<string | null>("materials-used");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Products & Personalization":
        return <Sparkles className="h-4 w-4 text-accent" />;
      case "Ordering & Packaging":
        return <ShoppingBag className="h-4 w-4 text-accent" />;
      case "Payment & Delivery":
        return <CreditCard className="h-4 w-4 text-accent" />;
      case "Customer Support":
        return <Headphones className="h-4 w-4 text-accent" />;
      default:
        return <HelpCircle className="h-4 w-4 text-accent" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Search & Filter Controls */}
      <div className="space-y-6">
        {/* Search Input */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or keywords (e.g., custom colors, COD, bulk orders)..."
            aria-label="Search frequently asked questions"
            className="w-full pl-12 pr-10 py-3.5 bg-surface/80 backdrop-blur border border-border/80 rounded-2xl text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary rounded-full transition-colors"
              aria-label="Clear search query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {FAQ_CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-accent text-white shadow-md shadow-accent/20 scale-[1.02]"
                    : "bg-surface/60 hover:bg-surface text-text-secondary hover:text-text-primary border border-border/60"
                }`}
              >
                {category !== "All" && getCategoryIcon(category)}
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion Container */}
      {filteredFaqs.length > 0 ? (
        <div className="space-y-4 max-w-3xl mx-auto">
          {filteredFaqs.map((faq: FAQItem) => {
            const isOpen = expandedId === faq.id;
            const headerId = `faq-header-${faq.id}`;
            const panelId = `faq-panel-${faq.id}`;

            return (
              <div
                key={faq.id}
                className={`group border rounded-2xl transition-all duration-300 ${
                  isOpen
                    ? "bg-surface border-accent/40 shadow-md shadow-accent/5 ring-1 ring-accent/20"
                    : "bg-surface/60 hover:bg-surface border-border/70 hover:border-border"
                }`}
              >
                <h3>
                  <button
                    id={headerId}
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between p-5 text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
                  >
                    <span className="text-base font-medium text-text-primary group-hover:text-accent transition-colors flex items-center gap-3">
                      <span className="inline-flex p-1.5 rounded-lg bg-accent/10 text-accent flex-shrink-0">
                        {getCategoryIcon(faq.category)}
                      </span>
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-text-secondary flex-shrink-0 transition-transform duration-300 ease-out ${
                        isOpen ? "rotate-180 text-accent" : ""
                      }`}
                    />
                  </button>
                </h3>

                {/* Animated Accordion Content */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1 text-sm font-light text-text-secondary leading-relaxed border-t border-border/40 mt-1">
                      <p className="pt-3">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Search Results State */
        <div className="text-center py-12 px-4 max-w-md mx-auto bg-surface/40 border border-border/60 rounded-2xl">
          <HelpCircle className="h-10 w-10 text-text-secondary/50 mx-auto mb-3" />
          <h3 className="text-base font-medium text-text-primary mb-1">No matching questions found</h3>
          <p className="text-xs text-text-secondary mb-4">
            Try adjusting your search terms or filter category to find what you are looking for.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("All");
            }}
            className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl text-xs font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Still Have Questions CTA */}
      <div className="max-w-3xl mx-auto mt-16 p-8 bg-gradient-to-r from-accent/10 via-surface to-accent/5 border border-accent/20 rounded-3xl text-center space-y-4 shadow-sm">
        <div className="inline-flex p-3 rounded-2xl bg-accent/10 text-accent mb-1">
          <MessageCircle className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-serif text-text-primary">Still have questions?</h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto font-light">
          Can&apos;t find the answer you&apos;re looking for? Feel free to get in touch with our friendly support team.
        </p>
        <div className="pt-2 flex items-center justify-center gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-accent/20 hover:scale-[1.02]"
          >
            Contact Customer Support
          </Link>
        </div>
      </div>
    </div>
  );
}
