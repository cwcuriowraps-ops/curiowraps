export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "Products & Personalization" | "Ordering & Packaging" | "Payment & Delivery" | "Customer Support";
}

export const FAQ_CATEGORIES = [
  "All",
  "Products & Personalization",
  "Ordering & Packaging",
  "Payment & Delivery",
  "Customer Support",
] as const;

export const FAQS: FAQItem[] = [
  {
    id: "materials-used",
    question: "What materials are used to make Curio Wrap products?",
    answer: "The materials used vary depending on the product. Please check the Product Description on each product page for detailed information.",
    category: "Products & Personalization",
  },
  {
    id: "custom-colors",
    question: "Can I choose custom colors for my order?",
    answer: "Yes. You can mention your preferred color in the Personalization box before placing your order.",
    category: "Products & Personalization",
  },
  {
    id: "personalized-message",
    question: "Can I add a personalized message with my gift?",
    answer: "Yes. Simply enter your message in the Personalization box, and we'll include it with your order.",
    category: "Products & Personalization",
  },
  {
    id: "gift-wrapping",
    question: "Do you offer gift wrapping or premium packaging?",
    answer: "Yes. Gift wrapping is available for an additional charge.",
    category: "Ordering & Packaging",
  },
  {
    id: "bulk-corporate-orders",
    question: "Do you accept bulk, wedding, corporate, or event orders?",
    answer: "Yes. We accept bulk, wedding, corporate, party, and event orders. Please contact us for pricing and customization.",
    category: "Ordering & Packaging",
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer: "We currently accept UPI and Cash (where applicable).",
    category: "Payment & Delivery",
  },
  {
    id: "cod-availability",
    question: "Is Cash on Delivery (COD) available?",
    answer: "Yes. COD is available for eligible orders. However, if the delivery is fulfilled through third-party services such as Porter or Uber, the order must be prepaid. Orders delivered directly by Curio Wrap are eligible for COD where available.",
    category: "Payment & Delivery",
  },
  {
    id: "photo-accuracy",
    question: "Will the product look exactly like the photos?",
    answer: "Yes. We strive to match every product as closely as possible to the photos. However, slight variations may occur due to handmade craftsmanship, lighting, screen settings, or material availability.",
    category: "Products & Personalization",
  },
  {
    id: "contact-support",
    question: "How do I contact customer support if I need help?",
    answer: "You can contact us by email or by sending a message on WhatsApp using the contact details provided on our Contact Us page.",
    category: "Customer Support",
  },
];
