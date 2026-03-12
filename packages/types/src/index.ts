export type AppRole = "super_admin" | "salon_owner" | "customer";
export type SalonStatus = "active" | "suspended" | "expired";
export type EnvironmentMode = "demo" | "production";

export interface TenantContext {
  salonId: string;
  tenantKey: string;
  status: SalonStatus;
  environmentMode: EnvironmentMode;
}

export interface WhiteLabelAppConfig {
  tenantKey: string;
  appName: string;
  iosBundleId: string;
  androidPackageName: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface SalonOperator {
  id: string;
  displayName: string;
  specialty: string;
  colorHex: string;
}

export interface SalonService {
  id: string;
  name: string;
  categoryName: string;
  durationMinutes: number;
  priceCents: number;
}

export interface SalonPortfolioItem {
  id: string;
  title: string;
  caption: string;
  imageHint: string;
}

export interface SalonPromotion {
  id: string;
  title: string;
  summary: string;
  discountLabel: string;
}

export interface PromotionCoupon {
  id: string;
  code: string;
  title: string;
  expiresAtLabel: string;
}

export interface CustomerAppointment {
  id: string;
  salonId: string;
  operatorName: string;
  status:
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "cancelled_by_customer"
    | "cancelled_by_salon"
    | "no_show";
  startsAtLabel: string;
  durationMinutes: number;
  totalPriceCents: number;
  serviceNames: string[];
  canReview: boolean;
}

export interface CustomerReview {
  id: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  createdAtLabel: string;
}

export interface CustomerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDateLabel: string;
  preferences: string[];
  privacyAccepted: boolean;
  marketingAccepted: boolean;
  authProvider: string;
}
