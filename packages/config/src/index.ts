export {
  designTokens,
  cssVariables,
  borderRadius,
  animation,
  spacing,
  type ThemeMode,
} from "./design-tokens";

export const appConfig = {
  name: "Curio Wrap",
  tagline: "Premium Shopping Experience",
  apiVersion: "v1",
  apiPrefix: "/api/v1",
  defaultPageSize: 24,
  maxPageSize: 100,
  currency: "INR",
  currencySymbol: "₹",
  supportEmail: "support@luxestore.com",
} as const;
