import type { Session, User } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { calculateAppointmentDuration } from "@repo/booking";
import type { SalonStatus } from "@repo/types";

import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export interface TenantBootstrap {
  salon_id: string;
  tenant_key: string;
  salon_name: string;
  app_display_name: string;
  primary_color: string;
  secondary_color: string;
  status: SalonStatus;
  environment_mode: "demo" | "production";
  demo_enabled: boolean;
}

export interface MobileOperator {
  id: string;
  display_name: string;
  bio: string | null;
  color_hex: string | null;
}

export interface MobileService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  category_name: string | null;
}

export interface MobilePortfolio {
  id: string;
  title: string;
  description: string | null;
}

export interface MobilePromotion {
  id: string;
  title: string;
  discount_type: string;
  discount_value: number;
  starts_at: string;
  ends_at: string;
}

export interface MobileCoupon {
  id: string;
  code: string;
  title: string;
  discount_type: string;
  discount_value: number;
  starts_at: string;
  ends_at: string;
}

export interface MobileReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
}

export interface MobileCustomer {
  id: string;
  salon_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
}

export interface MobileCustomerProfile {
  id: string;
  customer_id: string;
  preferences: { tags?: string[] } | null;
  total_appointments: number;
  last_visit_at: string | null;
}

export interface MobileAppointment {
  id: string;
  operator_id: string;
  status: string;
  start_at: string;
  end_at: string;
  notes: string | null;
  total_duration_minutes: number;
  total_price_cents: number;
  service_names: string[];
  coupon_id: string | null;
}

export interface MobileDashboardData {
  customer: MobileCustomer;
  profile: MobileCustomerProfile | null;
  privacyGranted: boolean;
  marketingGranted: boolean;
  operators: MobileOperator[];
  services: MobileService[];
  serviceAssignments: Record<string, string[]>;
  portfolio: MobilePortfolio[];
  promotions: MobilePromotion[];
  coupons: MobileCoupon[];
  reviews: MobileReview[];
  appointments: MobileAppointment[];
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Errore non previsto.";
}

export async function getTenantBootstrap(tenantKey: string) {
  const { data, error } = await supabase
    .rpc("get_tenant_bootstrap", {
      p_tenant_key: tenantKey
    })
    .single<TenantBootstrap>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getActiveSession() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return session;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}

export async function signInCustomer(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export async function signUpCustomer(input: {
  tenant: TenantBootstrap;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  privacyGranted: boolean;
  marketingGranted: boolean;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        tenantKey: input.tenant.tenant_key
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Utente non creato.");
  }

  const { error: registrationError } = await supabase.rpc("register_customer_membership", {
    p_salon_id: input.tenant.salon_id,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_email: input.email,
    p_phone: input.phone ?? null,
    p_date_of_birth: input.birthDate ?? null,
    p_privacy_granted: input.privacyGranted,
    p_marketing_granted: input.marketingGranted
  });

  if (registrationError) {
    throw new Error(registrationError.message);
  }

  return data.user;
}

export async function signOutCustomer() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function registerPushToken(
  tenant: TenantBootstrap,
  appVersion = "1.0.0"
): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const permission = await Notifications.getPermissionsAsync();
  let finalStatus = permission.status;

  if (finalStatus !== "granted") {
    const request = await Notifications.requestPermissionsAsync();
    finalStatus = request.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT
    });
  }

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  if (!projectId) {
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });

  const { error } = await supabase.rpc("register_customer_push_token", {
    p_salon_id: tenant.salon_id,
    p_expo_push_token: tokenResponse.data,
    p_platform: Platform.OS,
    p_device_label: Device.modelName ?? null,
    p_app_version: appVersion
  });

  if (error) {
    throw new Error(error.message);
  }

  return tokenResponse.data;
}

export async function unregisterPushToken(tenant: TenantBootstrap, expoPushToken: string | null) {
  if (!expoPushToken) {
    return;
  }

  const { error } = await supabase.rpc("deactivate_customer_push_token", {
    p_salon_id: tenant.salon_id,
    p_expo_push_token: expoPushToken
  });

  if (error) {
    throw new Error(error.message);
  }
}

function getAuthRedirectUrl() {
  return Linking.createURL("auth/callback");
}

function deriveNames(
  user: User,
  overrides?: {
    firstName?: string;
    lastName?: string;
  }
) {
  const fullName =
    overrides?.firstName && overrides?.lastName
      ? `${overrides.firstName} ${overrides.lastName}`
      : String(user.user_metadata.full_name ?? user.user_metadata.name ?? "").trim();
  const [derivedFirstName, ...rest] = fullName.split(" ").filter(Boolean);

  return {
    firstName: overrides?.firstName ?? String(user.user_metadata.given_name ?? derivedFirstName ?? "Cliente"),
    lastName: overrides?.lastName ?? String(user.user_metadata.family_name ?? rest.join(" ") ?? "App")
  };
}

export async function ensureCustomerMembership(
  tenant: TenantBootstrap,
  user: User,
  overrides?: {
    firstName?: string;
    lastName?: string;
  }
) {
  if (!user.email) {
    throw new Error("Email utente non disponibile per completare la registrazione.");
  }

  const names = deriveNames(user, overrides);

  const { error } = await supabase.rpc("register_customer_membership", {
    p_salon_id: tenant.salon_id,
    p_first_name: names.firstName,
    p_last_name: names.lastName,
    p_email: user.email,
    p_phone: null,
    p_date_of_birth: null,
    p_privacy_granted: true,
    p_marketing_granted: false
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signInWithGoogle() {
  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent"
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.url) {
    throw new Error("URL Google OAuth non disponibile.");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success" || !result.url) {
    throw new Error("Accesso Google annullato.");
  }

  const authResultUrl = new URL(result.url);
  const code = authResultUrl.searchParams.get("code");

  if (!code) {
    throw new Error("Codice Google OAuth non ricevuto.");
  }

  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    throw new Error(exchangeError.message);
  }

  return sessionData.session;
}

export async function signInWithApple() {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign In e disponibile solo su iPhone o iPad.");
  }

  const rawNonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL
    ],
    nonce: hashedNonce
  });

  if (!credential.identityToken) {
    throw new Error("Identity token Apple non disponibile.");
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
    nonce: rawNonce
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    session: data.session,
    firstName: credential.fullName?.givenName ?? undefined,
    lastName: credential.fullName?.familyName ?? undefined
  };
}

export async function fetchDashboardData(tenant: TenantBootstrap, user: User): Promise<MobileDashboardData> {
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, salon_id, first_name, last_name, email, phone, date_of_birth")
    .eq("salon_id", tenant.salon_id)
    .eq("auth_user_id", user.id)
    .single<MobileCustomer>();

  if (customerError) {
    throw new Error(customerError.message);
  }

  const [
    profileResponse,
    consentsResponse,
    operatorsResponse,
    categoriesResponse,
    servicesResponse,
    assignmentsResponse,
    portfolioResponse,
    promotionsResponse,
    couponsResponse,
    reviewsResponse,
    appointmentsResponse
  ] = await Promise.all([
    supabase
      .from("customer_profiles")
      .select("id, customer_id, preferences, total_appointments, last_visit_at")
      .eq("salon_id", tenant.salon_id)
      .eq("customer_id", customer.id)
      .maybeSingle<MobileCustomerProfile>(),
    supabase
      .from("consent_records")
      .select("consent_type, granted, created_at")
      .eq("salon_id", tenant.salon_id)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("operators")
      .select("id, display_name, bio, color_hex")
      .eq("salon_id", tenant.salon_id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("service_categories")
      .select("id, name")
      .eq("salon_id", tenant.salon_id)
      .eq("is_active", true),
    supabase
      .from("services")
      .select("id, name, description, duration_minutes, price_cents, category_id")
      .eq("salon_id", tenant.salon_id)
      .eq("is_active", true),
    supabase
      .from("service_operator_assignments")
      .select("service_id, operator_id")
      .eq("salon_id", tenant.salon_id),
    supabase
      .from("portfolios")
      .select("id, title, description")
      .eq("salon_id", tenant.salon_id)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("promotions")
      .select("id, title, discount_type, discount_value, starts_at, ends_at")
      .eq("salon_id", tenant.salon_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("coupons")
      .select("id, code, title, discount_type, discount_value, starts_at, ends_at")
      .eq("salon_id", tenant.salon_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("id, rating, title, body, created_at")
      .eq("salon_id", tenant.salon_id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("appointments")
      .select("id, operator_id, status, start_at, end_at, notes, total_duration_minutes, total_price_cents, coupon_id")
      .eq("salon_id", tenant.salon_id)
      .eq("customer_id", customer.id)
      .order("start_at", { ascending: false })
  ]);

  const profile = profileResponse.data ?? null;
  const consentRecords = consentsResponse.data ?? [];
  const operators = operatorsResponse.data ?? [];
  const categories = categoriesResponse.data ?? [];
  const rawServices = servicesResponse.data ?? [];
  const assignmentsRows = assignmentsResponse.data ?? [];
  const appointmentsRows = appointmentsResponse.data ?? [];
  const appointmentIds = appointmentsRows.map((appointment) => appointment.id);

  const services: MobileService[] = rawServices.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    duration_minutes: service.duration_minutes,
    price_cents: service.price_cents,
    category_name: categories.find((category) => category.id === service.category_id)?.name ?? null
  }));

  const serviceAssignments = assignmentsRows.reduce<Record<string, string[]>>((accumulator, row) => {
    accumulator[row.service_id] = [...(accumulator[row.service_id] ?? []), row.operator_id];
    return accumulator;
  }, {});

  const consentState = consentRecords.reduce<{ privacyGranted: boolean; marketingGranted: boolean }>(
    (accumulator, row) => {
      if (row.consent_type === "privacy" && accumulator.privacyGranted === false) {
        accumulator.privacyGranted = row.granted;
      }

      if (row.consent_type === "marketing" && accumulator.marketingGranted === false) {
        accumulator.marketingGranted = row.granted;
      }

      return accumulator;
    },
    { privacyGranted: false, marketingGranted: false }
  );

  const appointmentServicesResponse =
    appointmentIds.length > 0
      ? await supabase
          .from("appointment_services")
          .select("appointment_id, service_name_snapshot")
          .in("appointment_id", appointmentIds)
          .order("sort_order", { ascending: true })
      : { data: [], error: null };

  if (appointmentServicesResponse.error) {
    throw new Error(appointmentServicesResponse.error.message);
  }

  const appointmentServiceMap = (appointmentServicesResponse.data ?? []).reduce<Record<string, string[]>>(
    (accumulator, row) => {
      accumulator[row.appointment_id] = [...(accumulator[row.appointment_id] ?? []), row.service_name_snapshot];
      return accumulator;
    },
    {}
  );

  return {
    customer,
    profile,
    privacyGranted: consentState.privacyGranted,
    marketingGranted: consentState.marketingGranted,
    operators,
    services,
    serviceAssignments,
    portfolio: portfolioResponse.data ?? [],
    promotions: promotionsResponse.data ?? [],
    coupons: couponsResponse.data ?? [],
    reviews: reviewsResponse.data ?? [],
    appointments: appointmentsRows.map((appointment) => ({
      ...appointment,
      service_names: appointmentServiceMap[appointment.id] ?? []
    }))
  };
}

export async function createAppointment(input: {
  tenant: TenantBootstrap;
  operatorId: string;
  serviceIds: string[];
  startAtIso: string;
  notes?: string;
  couponId?: string;
}) {
  const { data, error } = await supabase.rpc("create_customer_appointment", {
    p_salon_id: input.tenant.salon_id,
    p_operator_id: input.operatorId,
    p_start_at: input.startAtIso,
    p_service_ids: input.serviceIds,
    p_notes: input.notes ?? null,
    p_coupon_id: input.couponId ?? null
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function rescheduleAppointment(input: {
  appointmentId: string;
  operatorId: string;
  startAtIso: string;
  notes?: string;
}) {
  const { data, error } = await supabase.rpc("reschedule_customer_appointment", {
    p_appointment_id: input.appointmentId,
    p_operator_id: input.operatorId,
    p_start_at: input.startAtIso,
    p_notes: input.notes ?? null
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function cancelAppointment(appointmentId: string) {
  const { data, error } = await supabase.rpc("cancel_customer_appointment", {
    p_appointment_id: appointmentId
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createReview(input: {
  tenant: TenantBootstrap;
  customerId: string;
  appointmentId: string;
  rating: number;
  title: string;
  body: string;
}) {
  const { error } = await supabase.from("reviews").upsert({
    salon_id: input.tenant.salon_id,
    customer_id: input.customerId,
    appointment_id: input.appointmentId,
    rating: input.rating,
    title: input.title,
    body: input.body,
    is_published: true
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCustomerProfile(input: {
  tenant: TenantBootstrap;
  customerId: string;
  profileId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  preferences: string[];
  privacyGranted: boolean;
  marketingGranted: boolean;
}) {
  const customerUpdate = await supabase
    .from("customers")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone ?? null,
      date_of_birth: input.birthDate ?? null
    })
    .eq("id", input.customerId)
    .eq("salon_id", input.tenant.salon_id);

  if (customerUpdate.error) {
    throw new Error(customerUpdate.error.message);
  }

  if (input.profileId) {
    const profileUpdate = await supabase
      .from("customer_profiles")
      .update({
        preferences: {
          tags: input.preferences
        }
      })
      .eq("id", input.profileId)
      .eq("salon_id", input.tenant.salon_id);

    if (profileUpdate.error) {
      throw new Error(profileUpdate.error.message);
    }
  }

  const consentInsert = await supabase.from("consent_records").insert([
    {
      salon_id: input.tenant.salon_id,
      customer_id: input.customerId,
      consent_type: "privacy",
      granted: input.privacyGranted,
      source: "mobile_profile"
    },
    {
      salon_id: input.tenant.salon_id,
      customer_id: input.customerId,
      consent_type: "marketing",
      granted: input.marketingGranted,
      source: "mobile_profile"
    }
  ]);

  if (consentInsert.error) {
    throw new Error(consentInsert.error.message);
  }
}

export function formatMobileError(error: unknown) {
  return normalizeError(error);
}

export function buildStartAtIso(dateLabel: string, timeLabel: string) {
  const [day, monthName] = dateLabel.split(" ");
  const monthMap: Record<string, number> = {
    Gennaio: 0,
    Febbraio: 1,
    Marzo: 2,
    Aprile: 3,
    Maggio: 4,
    Giugno: 5,
    Luglio: 6,
    Agosto: 7,
    Settembre: 8,
    Ottobre: 9,
    Novembre: 10,
    Dicembre: 11
  };

  const [hours, minutes] = timeLabel.split(":").map(Number);
  const currentYear = new Date().getFullYear();
  const date = new Date(Date.UTC(currentYear, monthMap[monthName] ?? 0, Number(day), hours - 1, minutes));

  return date.toISOString();
}

export function getEnabledServicesForOperator(
  services: MobileService[],
  serviceAssignments: Record<string, string[]>,
  operatorId: string
) {
  return services.filter((service) => (serviceAssignments[service.id] ?? []).includes(operatorId));
}

export function getAppointmentTotalMinutes(services: MobileService[], serviceIds: string[]) {
  return calculateAppointmentDuration({
    serviceDurations: services
      .filter((service) => serviceIds.includes(service.id))
      .map((service) => service.duration_minutes),
    bufferMinutes: 5
  });
}
