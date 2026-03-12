import { StatusBar } from "expo-status-bar";
import { useEffect, useState, type PropsWithChildren } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";

import type { Session } from "@supabase/supabase-js";

import {
  buildStartAtIso,
  cancelAppointment,
  createAppointment,
  createReview,
  ensureCustomerMembership,
  fetchDashboardData,
  formatMobileError,
  getActiveSession,
  getAppointmentTotalMinutes,
  getEnabledServicesForOperator,
  getTenantBootstrap,
  onAuthStateChange,
  registerPushToken,
  rescheduleAppointment,
  signInCustomer,
  signInWithApple,
  signInWithGoogle,
  signOutCustomer,
  signUpCustomer,
  unregisterPushToken,
  updateCustomerProfile,
  type MobileDashboardData,
  type TenantBootstrap
} from "./src/lib/mobile-api";

type AuthMode = "login" | "register";
type MobileTab = "home" | "book" | "appointments" | "reviews" | "profile";

interface RegisterDraft {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  privacyGranted: boolean;
  marketingGranted: boolean;
}

interface BookingDraft {
  operatorId: string;
  serviceIds: string[];
  selectedDate: string;
  selectedTime: string;
}

const tenantKey = process.env.EXPO_PUBLIC_TENANT_KEY ?? "atelier-uomo-firenze";
const availableDates = ["18 Marzo", "19 Marzo", "20 Marzo", "21 Marzo"];
const availableTimes = ["09:00", "10:30", "12:00", "15:00", "17:30"];

export default function App() {
  const [tenant, setTenant] = useState<TenantBootstrap | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [dashboard, setDashboard] = useState<MobileDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerDraft, setRegisterDraft] = useState<RegisterDraft>({
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    privacyGranted: true,
    marketingGranted: false
  });
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>({
    operatorId: "",
    serviceIds: [],
    selectedDate: availableDates[0],
    selectedTime: availableTimes[0]
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrapApp() {
      try {
        const [tenantData, currentSession] = await Promise.all([
          getTenantBootstrap(tenantKey),
          getActiveSession()
        ]);

        if (!mounted) {
          return;
        }

        setTenant(tenantData);
        setSession(currentSession);

        if (currentSession?.user) {
          await ensureCustomerMembership(tenantData, currentSession.user);
          const data = await fetchDashboardData(tenantData, currentSession.user);

          if (!mounted) {
            return;
          }

          setDashboard(data);
          setBookingDraft((current) => ({
            ...current,
            operatorId: data.operators[0]?.id ?? ""
          }));
          setEmail((current) => current || data.customer.email);
          const devicePushToken = await registerPushToken(tenantData);
          setPushToken(devicePushToken);
        }
      } catch (error) {
        if (mounted) {
          setMessage(formatMobileError(error));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrapApp();

    const unsubscribe = onAuthStateChange(async (nextSession) => {
      setSession(nextSession);

      if (tenant && nextSession?.user) {
        try {
          await ensureCustomerMembership(tenant, nextSession.user);
          const data = await fetchDashboardData(tenant, nextSession.user);
          setDashboard(data);
          setBookingDraft((current) => ({
            ...current,
            operatorId: data.operators[0]?.id ?? ""
          }));
          const devicePushToken = await registerPushToken(tenant);
          setPushToken(devicePushToken);
        } catch (error) {
          setMessage(formatMobileError(error));
        }
      }

      if (!nextSession) {
        setDashboard(null);
        setActiveTab("home");
        setPushToken(null);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function reloadDashboard(currentTenant: TenantBootstrap, currentSession: Session) {
    const data = await fetchDashboardData(currentTenant, currentSession.user);
    setDashboard(data);
    if (!bookingDraft.operatorId) {
      setBookingDraft((current) => ({
        ...current,
        operatorId: data.operators[0]?.id ?? ""
      }));
    }
  }

  async function handleAuthSubmit() {
    if (!tenant) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      if (tenant.status !== "active") {
        throw new Error(`App bloccata: salone ${tenant.status}.`);
      }

      if (authMode === "login") {
        const nextSession = await signInCustomer(email, password);

        if (nextSession) {
          setSession(nextSession);
          await reloadDashboard(tenant, nextSession);
        }
      } else {
        const user = await signUpCustomer({
          tenant,
          email,
          password,
          firstName: registerDraft.firstName,
          lastName: registerDraft.lastName,
          phone: registerDraft.phone,
          birthDate: registerDraft.birthDate,
          privacyGranted: registerDraft.privacyGranted,
          marketingGranted: registerDraft.marketingGranted
        });

        const nextSession = await signInCustomer(email, password);
        if (nextSession && user) {
          setSession(nextSession);
          await reloadDashboard(tenant, nextSession);
        }
      }
    } catch (error) {
      setMessage(formatMobileError(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!tenant) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const nextSession = await signInWithGoogle();

      if (nextSession) {
        await ensureCustomerMembership(tenant, nextSession.user);
        setSession(nextSession);
        await reloadDashboard(tenant, nextSession);
      }
    } catch (error) {
      setMessage(formatMobileError(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAppleLogin() {
    if (!tenant) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const result = await signInWithApple();

      if (result.session) {
        await ensureCustomerMembership(tenant, result.session.user, {
          firstName: result.firstName,
          lastName: result.lastName
        });
        setSession(result.session);
        await reloadDashboard(tenant, result.session);
      }
    } catch (error) {
      setMessage(formatMobileError(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBooking() {
    if (!tenant || !session || !dashboard || bookingDraft.serviceIds.length === 0) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await createAppointment({
        tenant,
        operatorId: bookingDraft.operatorId,
        serviceIds: bookingDraft.serviceIds,
        startAtIso: buildStartAtIso(bookingDraft.selectedDate, bookingDraft.selectedTime)
      });

      await reloadDashboard(tenant, session);
      setActiveTab("appointments");
      setMessage("Prenotazione creata con successo.");
    } catch (error) {
      setMessage(formatMobileError(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelAppointment(appointmentId: string) {
    if (!tenant || !session) {
      return;
    }

    setActionLoading(true);

    try {
      await cancelAppointment(appointmentId);
      await reloadDashboard(tenant, session);
      setMessage("Prenotazione annullata.");
    } catch (error) {
      setMessage(formatMobileError(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRescheduleAppointment(appointmentId: string, operatorId: string) {
    if (!tenant || !session) {
      return;
    }

    setActionLoading(true);

    try {
      await rescheduleAppointment({
        appointmentId,
        operatorId,
        startAtIso: buildStartAtIso(bookingDraft.selectedDate, bookingDraft.selectedTime)
      });
      await reloadDashboard(tenant, session);
      setMessage("Prenotazione spostata sul nuovo slot selezionato.");
    } catch (error) {
      setMessage(formatMobileError(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateReview(appointmentId: string) {
    if (!tenant || !session || !dashboard) {
      return;
    }

    setActionLoading(true);

    try {
      await createReview({
        tenant,
        customerId: dashboard.customer.id,
        appointmentId,
        rating: 5,
        title: "Esperienza premium",
        body: "Prenotazione gestita con precisione e risultato coerente con il portfolio del salone."
      });
      await reloadDashboard(tenant, session);
      setActiveTab("reviews");
      setMessage("Recensione pubblicata.");
    } catch (error) {
      setMessage(formatMobileError(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleProfileSave() {
    if (!tenant || !session || !dashboard) {
      return;
    }

    setActionLoading(true);

    try {
      await updateCustomerProfile({
        tenant,
        customerId: dashboard.customer.id,
        profileId: dashboard.profile?.id,
        firstName: dashboard.customer.first_name,
        lastName: dashboard.customer.last_name,
        phone: dashboard.customer.phone ?? "",
        birthDate: dashboard.customer.date_of_birth ?? "",
        preferences: dashboard.profile?.preferences?.tags ?? [],
        privacyGranted: dashboard.privacyGranted,
        marketingGranted: dashboard.marketingGranted
      });
      await reloadDashboard(tenant, session);
      setMessage("Profilo aggiornato.");
    } catch (error) {
      setMessage(formatMobileError(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLogout() {
    setActionLoading(true);

    try {
      if (tenant) {
        await unregisterPushToken(tenant, pushToken);
      }
      await signOutCustomer();
      setMessage(null);
      setPushToken(null);
    } catch (error) {
      setMessage(formatMobileError(error));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <StatusBar style="dark" />
        <Text style={styles.sectionTitle}>Caricamento app cliente...</Text>
      </SafeAreaView>
    );
  }

  if (!tenant) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <Text style={styles.sectionTitle}>Tenant non trovato</Text>
      </SafeAreaView>
    );
  }

  if (tenant.status !== "active") {
    return (
      <SafeAreaView style={[styles.centeredScreen, { backgroundColor: tenant.secondary_color }]}>
        <StatusBar style="light" />
        <Text style={[styles.heroTitle, { textAlign: "center" }]}>{tenant.app_display_name}</Text>
        <Text style={[styles.heroText, { textAlign: "center" }]}>
          App temporaneamente bloccata. Stato del salone: {tenant.status}.
        </Text>
      </SafeAreaView>
    );
  }

  if (!session || !dashboard) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: tenant.secondary_color }]}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>{tenant.tenant_key}</Text>
            <Text style={styles.heroTitle}>{tenant.app_display_name}</Text>
            <Text style={styles.heroText}>
              Login reale con Supabase Auth. Dati letti dal tenant attivo e isolati via RLS.
            </Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.segmented}>
              <SegmentButton
                active={authMode === "login"}
                label="Login"
                onPress={() => setAuthMode("login")}
              />
              <SegmentButton
                active={authMode === "register"}
                label="Registrazione"
                onPress={() => setAuthMode("register")}
              />
            </View>

            {message ? <InlineMessage text={message} tone="error" /> : null}

            <Field label="Email">
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="cliente@email.it"
                placeholderTextColor="#72818c"
                style={styles.input}
                value={email}
              />
            </Field>

            <Field label="Password">
              <TextInput
                onChangeText={setPassword}
                placeholder="Minimo 8 caratteri"
                placeholderTextColor="#72818c"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </Field>

            {authMode === "register" ? (
              <>
                <Field label="Nome">
                  <TextInput
                    onChangeText={(value) =>
                      setRegisterDraft((current) => ({ ...current, firstName: value }))
                    }
                    placeholder="Nome"
                    placeholderTextColor="#72818c"
                    style={styles.input}
                    value={registerDraft.firstName}
                  />
                </Field>
                <Field label="Cognome">
                  <TextInput
                    onChangeText={(value) =>
                      setRegisterDraft((current) => ({ ...current, lastName: value }))
                    }
                    placeholder="Cognome"
                    placeholderTextColor="#72818c"
                    style={styles.input}
                    value={registerDraft.lastName}
                  />
                </Field>
                <Field label="Telefono">
                  <TextInput
                    onChangeText={(value) =>
                      setRegisterDraft((current) => ({ ...current, phone: value }))
                    }
                    placeholder="+39 ..."
                    placeholderTextColor="#72818c"
                    style={styles.input}
                    value={registerDraft.phone}
                  />
                </Field>
                <Field label="Data di nascita">
                  <TextInput
                    onChangeText={(value) =>
                      setRegisterDraft((current) => ({ ...current, birthDate: value }))
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#72818c"
                    style={styles.input}
                    value={registerDraft.birthDate}
                  />
                </Field>
                <ConsentRow
                  active={registerDraft.privacyGranted}
                  label="Consenso privacy"
                  onValueChange={(value) =>
                    setRegisterDraft((current) => ({ ...current, privacyGranted: value }))
                  }
                />
                <ConsentRow
                  active={registerDraft.marketingGranted}
                  label="Consenso marketing"
                  onValueChange={(value) =>
                    setRegisterDraft((current) => ({ ...current, marketingGranted: value }))
                  }
                />
              </>
            ) : null}

            <PrimaryButton
              color={tenant.primary_color}
              disabled={actionLoading}
              label={actionLoading ? "Attendere..." : authMode === "login" ? "Entra nell'app" : "Crea account"}
              onPress={handleAuthSubmit}
            />

            <View style={styles.socialRow}>
              <GhostButton label="Continua con Google" onPress={handleGoogleLogin} />
              <GhostButton label="Continua con Apple" onPress={handleAppleLogin} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const visibleServices = bookingDraft.operatorId
    ? getEnabledServicesForOperator(dashboard.services, dashboard.serviceAssignments, bookingDraft.operatorId)
    : dashboard.services;
  const selectedOperator = dashboard.operators.find((operator) => operator.id === bookingDraft.operatorId);
  const selectedServices = dashboard.services.filter((service) => bookingDraft.serviceIds.includes(service.id));
  const totalMinutes = getAppointmentTotalMinutes(dashboard.services, bookingDraft.serviceIds);
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price_cents, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.appHeader}>
        <View>
          <Text style={styles.appEyebrow}>{tenant.app_display_name}</Text>
          <Text style={styles.appTitle}>
            {dashboard.customer.first_name} {dashboard.customer.last_name}
          </Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutPill}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.screenContent}>
        {message ? <InlineMessage text={message} tone="info" /> : null}

        {activeTab === "home" ? (
          <HomeTab
            coupons={dashboard.coupons}
            portfolio={dashboard.portfolio}
            promotions={dashboard.promotions}
            services={dashboard.services}
            tenant={tenant}
          />
        ) : null}

        {activeTab === "book" ? (
          <BookingTab
            bookingDraft={bookingDraft}
            operators={dashboard.operators}
            services={visibleServices}
            selectedOperatorName={selectedOperator?.display_name}
            tenant={tenant}
            totalMinutes={totalMinutes}
            totalPrice={totalPrice}
            onCreate={handleBooking}
            onSelectDate={(selectedDate) =>
              setBookingDraft((current) => ({ ...current, selectedDate }))
            }
            onSelectOperator={(operatorId) =>
              setBookingDraft((current) => ({
                ...current,
                operatorId,
                serviceIds: []
              }))
            }
            onSelectTime={(selectedTime) =>
              setBookingDraft((current) => ({ ...current, selectedTime }))
            }
            onToggleService={(serviceId) =>
              setBookingDraft((current) => {
                const exists = current.serviceIds.includes(serviceId);
                return {
                  ...current,
                  serviceIds: exists
                    ? current.serviceIds.filter((id) => id !== serviceId)
                    : [...current.serviceIds, serviceId]
                };
              })
            }
          />
        ) : null}

        {activeTab === "appointments" ? (
          <AppointmentsTab
            appointments={dashboard.appointments}
            operators={dashboard.operators}
            onCancel={handleCancelAppointment}
            onReschedule={handleRescheduleAppointment}
            onReview={handleCreateReview}
          />
        ) : null}

        {activeTab === "reviews" ? <ReviewsTab reviews={dashboard.reviews} /> : null}

        {activeTab === "profile" ? (
          <ProfileTab
            customer={dashboard.customer}
            profile={dashboard.profile}
            privacyGranted={dashboard.privacyGranted}
            marketingGranted={dashboard.marketingGranted}
            onSave={handleProfileSave}
            onUpdateCustomer={(field, value) =>
              setDashboard((current) =>
                current
                  ? {
                      ...current,
                      customer: {
                        ...current.customer,
                        [field]: value
                      }
                    }
                  : current
              )
            }
            onUpdateConsent={(field, value) =>
              setDashboard((current) =>
                current
                  ? {
                      ...current,
                      [field]: value
                    }
                  : current
              )
            }
          />
        ) : null}
      </ScrollView>

      <View style={styles.tabBar}>
        <TabButton active={activeTab === "home"} label="Home" onPress={() => setActiveTab("home")} />
        <TabButton active={activeTab === "book"} label="Prenota" onPress={() => setActiveTab("book")} />
        <TabButton
          active={activeTab === "appointments"}
          label="Appunt."
          onPress={() => setActiveTab("appointments")}
        />
        <TabButton active={activeTab === "reviews"} label="Recensioni" onPress={() => setActiveTab("reviews")} />
        <TabButton active={activeTab === "profile"} label="Profilo" onPress={() => setActiveTab("profile")} />
      </View>
    </SafeAreaView>
  );
}

function HomeTab({
  coupons,
  portfolio,
  promotions,
  services,
  tenant
}: {
  coupons: MobileDashboardData["coupons"];
  portfolio: MobileDashboardData["portfolio"];
  promotions: MobileDashboardData["promotions"];
  services: MobileDashboardData["services"];
  tenant: TenantBootstrap;
}) {
  return (
    <View style={styles.stackLarge}>
      <SectionCard>
        <Text style={styles.sectionEyebrow}>Portfolio reale</Text>
        <Text style={styles.sectionTitle}>Contenuti caricati nel tenant</Text>
        <View style={styles.stackMedium}>
          {portfolio.map((item) => (
            <View key={item.id} style={styles.highlightCard}>
              <Text style={styles.listTitle}>{item.title}</Text>
              <Text style={styles.sectionText}>{item.description ?? "Nessuna descrizione"}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionEyebrow}>Servizi</Text>
        <Text style={styles.sectionTitle}>Listino reale</Text>
        <View style={styles.stackMedium}>
          {services.map((service) => (
            <View key={service.id} style={styles.rowBetween}>
              <View style={styles.stackTiny}>
                <Text style={styles.listTitle}>{service.name}</Text>
                <Text style={styles.sectionText}>
                  {service.duration_minutes} min • {service.category_name ?? "Generale"}
                </Text>
              </View>
              <Text style={styles.priceTag}>{formatPrice(service.price_cents)}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionEyebrow}>Promozioni</Text>
        <Text style={styles.sectionTitle}>Attive per {tenant.app_display_name}</Text>
        <View style={styles.stackMedium}>
          {promotions.map((promotion) => (
            <View key={promotion.id} style={styles.highlightCard}>
              <Text style={styles.listTitle}>{promotion.title}</Text>
              <Text style={styles.sectionText}>
                {promotion.discount_type} • {promotion.discount_value}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionEyebrow}>Coupon</Text>
        <Text style={styles.sectionTitle}>Disponibili</Text>
        <View style={styles.stackMedium}>
          {coupons.map((coupon) => (
            <View key={coupon.id} style={styles.couponCard}>
              <Text style={styles.couponCode}>{coupon.code}</Text>
              <Text style={[styles.sectionText, { color: "#e7edf0" }]}>{coupon.title}</Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </View>
  );
}

function BookingTab({
  bookingDraft,
  operators,
  services,
  selectedOperatorName,
  tenant,
  totalMinutes,
  totalPrice,
  onCreate,
  onSelectDate,
  onSelectOperator,
  onSelectTime,
  onToggleService
}: {
  bookingDraft: BookingDraft;
  operators: MobileDashboardData["operators"];
  services: MobileDashboardData["services"];
  selectedOperatorName?: string;
  tenant: TenantBootstrap;
  totalMinutes: number;
  totalPrice: number;
  onCreate: () => void;
  onSelectDate: (value: string) => void;
  onSelectOperator: (value: string) => void;
  onSelectTime: (value: string) => void;
  onToggleService: (serviceId: string) => void;
}) {
  return (
    <View style={styles.stackLarge}>
      <SectionCard>
        <Text style={styles.sectionEyebrow}>Prenotazione reale</Text>
        <Text style={styles.sectionTitle}>Operatore e servizi dal database</Text>

        <View style={styles.choiceWrap}>
          {operators.map((operator) => (
            <ChoicePill
              active={bookingDraft.operatorId === operator.id}
              key={operator.id}
              label={operator.display_name}
              onPress={() => onSelectOperator(operator.id)}
            />
          ))}
        </View>

        <View style={styles.stackMedium}>
          {services.map((service) => (
            <Pressable
              key={service.id}
              onPress={() => onToggleService(service.id)}
              style={[
                styles.serviceCard,
                bookingDraft.serviceIds.includes(service.id) && {
                  borderColor: tenant.primary_color,
                  backgroundColor: `${tenant.primary_color}10`
                }
              ]}
            >
              <View style={styles.rowBetween}>
                <View style={styles.stackTiny}>
                  <Text style={styles.listTitle}>{service.name}</Text>
                  <Text style={styles.sectionText}>
                    {service.duration_minutes} min • {service.category_name ?? "Generale"}
                  </Text>
                </View>
                <Text style={styles.priceTag}>{formatPrice(service.price_cents)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionEyebrow}>Slot da confermare</Text>
        <Text style={styles.sectionTitle}>Base reale con validazione backend</Text>
        <Text style={styles.smallMuted}>
          In questa tranche lo slot viene confermato dal backend. Se c'e conflitto, la richiesta viene
          respinta.
        </Text>

        <View style={styles.choiceWrap}>
          {availableDates.map((date) => (
            <ChoicePill
              active={bookingDraft.selectedDate === date}
              key={date}
              label={date}
              onPress={() => onSelectDate(date)}
            />
          ))}
        </View>

        <View style={styles.choiceWrap}>
          {availableTimes.map((time) => (
            <ChoicePill
              active={bookingDraft.selectedTime === time}
              key={time}
              label={time}
              onPress={() => onSelectTime(time)}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionEyebrow}>Riepilogo</Text>
        <Text style={styles.sectionTitle}>Conferma</Text>
        <Text style={styles.sectionText}>Operatore: {selectedOperatorName ?? "Seleziona"}</Text>
        <Text style={styles.sectionText}>Durata totale: {totalMinutes} minuti</Text>
        <Text style={styles.sectionText}>Totale: {formatPrice(totalPrice)}</Text>
        <Text style={styles.sectionText}>
          Slot: {bookingDraft.selectedDate} alle {bookingDraft.selectedTime}
        </Text>
        <PrimaryButton color={tenant.primary_color} label="Conferma prenotazione" onPress={onCreate} />
      </SectionCard>
    </View>
  );
}

function AppointmentsTab({
  appointments,
  operators,
  onCancel,
  onReschedule,
  onReview
}: {
  appointments: MobileDashboardData["appointments"];
  operators: MobileDashboardData["operators"];
  onCancel: (appointmentId: string) => void;
  onReschedule: (appointmentId: string, operatorId: string) => void;
  onReview: (appointmentId: string) => void;
}) {
  return (
    <View style={styles.stackLarge}>
      <SectionCard>
        <Text style={styles.sectionEyebrow}>Appuntamenti reali</Text>
        <Text style={styles.sectionTitle}>Dati letti dal database</Text>
        <View style={styles.stackMedium}>
          {appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <Text style={styles.listTitle}>{appointment.service_names.join(", ")}</Text>
              <Text style={styles.sectionText}>
                {new Date(appointment.start_at).toLocaleString("it-IT")}
              </Text>
              <Text style={styles.smallMuted}>
                {
                  operators.find((operator) => operator.id === appointment.operator_id)?.display_name
                }{" "}
                • {appointment.status}
              </Text>
              <View style={styles.actionRow}>
                <GhostButton label="Sposta" onPress={() => onReschedule(appointment.id, appointment.operator_id)} />
                <GhostButton label="Annulla" onPress={() => onCancel(appointment.id)} />
                {appointment.status === "completed" ? (
                  <GhostButton label="Recensisci" onPress={() => onReview(appointment.id)} />
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </SectionCard>
    </View>
  );
}

function ReviewsTab({ reviews }: { reviews: MobileDashboardData["reviews"] }) {
  return (
    <View style={styles.stackLarge}>
      <SectionCard>
        <Text style={styles.sectionEyebrow}>Recensioni reali</Text>
        <Text style={styles.sectionTitle}>Pubblicate dal tenant</Text>
        <View style={styles.stackMedium}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.highlightCard}>
              <Text style={styles.listTitle}>{review.title ?? "Recensione"}</Text>
              <Text style={styles.sectionText}>{review.body ?? "Nessun testo"}</Text>
              <Text style={styles.smallMuted}>
                {review.rating}/5 • {new Date(review.created_at).toLocaleDateString("it-IT")}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </View>
  );
}

function ProfileTab({
  customer,
  profile,
  privacyGranted,
  marketingGranted,
  onSave,
  onUpdateCustomer,
  onUpdateConsent
}: {
  customer: MobileDashboardData["customer"];
  profile: MobileDashboardData["profile"];
  privacyGranted: boolean;
  marketingGranted: boolean;
  onSave: () => void;
  onUpdateCustomer: (
    field: "first_name" | "last_name" | "phone" | "date_of_birth",
    value: string
  ) => void;
  onUpdateConsent: (field: "privacyGranted" | "marketingGranted", value: boolean) => void;
}) {
  return (
    <View style={styles.stackLarge}>
      <SectionCard>
        <Text style={styles.sectionEyebrow}>Profilo cliente</Text>
        <Text style={styles.sectionTitle}>Dati reali modificabili</Text>

        <Field label="Nome">
          <TextInput
            onChangeText={(value) => onUpdateCustomer("first_name", value)}
            style={styles.input}
            value={customer.first_name}
          />
        </Field>

        <Field label="Cognome">
          <TextInput
            onChangeText={(value) => onUpdateCustomer("last_name", value)}
            style={styles.input}
            value={customer.last_name}
          />
        </Field>

        <Field label="Telefono">
          <TextInput
            onChangeText={(value) => onUpdateCustomer("phone", value)}
            style={styles.input}
            value={customer.phone ?? ""}
          />
        </Field>

        <Field label="Data di nascita">
          <TextInput
            onChangeText={(value) => onUpdateCustomer("date_of_birth", value)}
            style={styles.input}
            value={customer.date_of_birth ?? ""}
          />
        </Field>

        <Text style={styles.sectionText}>
          Preferenze: {profile?.preferences?.tags?.join(", ") || "nessuna preferenza"}
        </Text>

        <ConsentRow
          active={privacyGranted}
          label="Consenso privacy"
          onValueChange={(value) => onUpdateConsent("privacyGranted", value)}
        />
        <ConsentRow
          active={marketingGranted}
          label="Consenso marketing"
          onValueChange={(value) => onUpdateConsent("marketingGranted", value)}
        />

        <PrimaryButton color="#1d2d33" label="Salva profilo" onPress={onSave} />
      </SectionCard>
    </View>
  );
}

function PrimaryButton({
  color,
  disabled,
  label,
  onPress
}: {
  color: string;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, { backgroundColor: color, opacity: disabled ? 0.6 : 1 }]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.ghostButton}>
      <Text style={styles.ghostButtonText}>{label}</Text>
    </Pressable>
  );
}

function TabButton({
  active,
  label,
  onPress
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function ChoicePill({
  active,
  label,
  onPress
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choicePill, active && styles.choicePillActive]}>
      <Text style={[styles.choicePillText, active && styles.choicePillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ConsentRow({
  active,
  label,
  onValueChange
}: {
  active: boolean;
  label: string;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.sectionText}>{label}</Text>
      <Switch onValueChange={onValueChange} value={active} />
    </View>
  );
}

function SegmentButton({
  active,
  label,
  onPress
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({ children, label }: PropsWithChildren<{ label: string }>) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SectionCard({ children }: PropsWithChildren) {
  return <View style={styles.sectionCard}>{children}</View>;
}

function InlineMessage({ text, tone }: { text: string; tone: "error" | "info" }) {
  return (
    <View style={[styles.inlineMessage, tone === "error" ? styles.inlineMessageError : styles.inlineMessageInfo]}>
      <Text style={styles.inlineMessageText}>{text}</Text>
    </View>
  );
}

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(priceCents / 100);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4efe8"
  },
  centeredScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4efe8",
    padding: 24
  },
  authScroll: {
    flexGrow: 1,
    gap: 18,
    justifyContent: "center",
    padding: 24
  },
  heroCard: {
    backgroundColor: "#1d2d33",
    borderRadius: 28,
    gap: 8,
    padding: 28
  },
  heroEyebrow: {
    color: "#d9bd8b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700"
  },
  heroText: {
    color: "#d0d9dd",
    fontSize: 15,
    lineHeight: 22
  },
  authCard: {
    backgroundColor: "#fffaf3",
    borderRadius: 24,
    gap: 16,
    padding: 24
  },
  segmented: {
    backgroundColor: "#efe7da",
    borderRadius: 16,
    flexDirection: "row",
    padding: 4
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12
  },
  segmentButtonActive: {
    backgroundColor: "#1d2d33"
  },
  segmentLabel: {
    color: "#425159",
    fontSize: 14,
    fontWeight: "600"
  },
  segmentLabelActive: {
    color: "#ffffff"
  },
  fieldWrap: {
    gap: 8
  },
  fieldLabel: {
    color: "#33434a",
    fontSize: 13,
    fontWeight: "600"
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d6d9dc",
    borderRadius: 14,
    borderWidth: 1,
    color: "#112025",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  socialRow: {
    gap: 12
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 16
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  },
  ghostButton: {
    alignItems: "center",
    borderColor: "#d6ddd8",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  ghostButtonText: {
    color: "#23343b",
    fontSize: 13,
    fontWeight: "600"
  },
  appHeader: {
    alignItems: "center",
    backgroundColor: "#fff9f0",
    borderBottomColor: "#e1d8c9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18
  },
  appEyebrow: {
    color: "#805d2e",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  appTitle: {
    color: "#17252a",
    fontSize: 24,
    fontWeight: "700"
  },
  logoutPill: {
    backgroundColor: "#1d2d33",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700"
  },
  screenContent: {
    gap: 18,
    padding: 18,
    paddingBottom: 120
  },
  stackLarge: {
    gap: 18
  },
  stackMedium: {
    gap: 12
  },
  stackTiny: {
    gap: 4
  },
  sectionCard: {
    backgroundColor: "#fffdf9",
    borderColor: "#e8dfd1",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 20
  },
  sectionEyebrow: {
    color: "#8a6231",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  sectionTitle: {
    color: "#18272d",
    fontSize: 22,
    fontWeight: "700"
  },
  sectionText: {
    color: "#47575f",
    fontSize: 14,
    lineHeight: 21
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  listTitle: {
    color: "#19282d",
    fontSize: 15,
    fontWeight: "700"
  },
  priceTag: {
    color: "#152328",
    fontSize: 14,
    fontWeight: "700"
  },
  highlightCard: {
    backgroundColor: "#f8f1e4",
    borderRadius: 18,
    gap: 8,
    padding: 16
  },
  couponCard: {
    backgroundColor: "#1d2d33",
    borderRadius: 18,
    gap: 6,
    padding: 18
  },
  couponCode: {
    color: "#dcbc86",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1
  },
  smallMuted: {
    color: "#77878f",
    fontSize: 12
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  choicePill: {
    backgroundColor: "#f1ede6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  choicePillActive: {
    backgroundColor: "#1d2d33"
  },
  choicePillText: {
    color: "#42535a",
    fontSize: 13,
    fontWeight: "600"
  },
  choicePillTextActive: {
    color: "#ffffff"
  },
  serviceCard: {
    borderColor: "#e2d8ca",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16
  },
  appointmentCard: {
    backgroundColor: "#fff8f0",
    borderRadius: 18,
    gap: 10,
    padding: 16
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  tabBar: {
    backgroundColor: "#fffdf8",
    borderTopColor: "#e8ddcc",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    left: 0,
    paddingBottom: 18,
    paddingTop: 12,
    position: "absolute",
    right: 0
  },
  tabButton: {
    paddingHorizontal: 4,
    paddingVertical: 8
  },
  tabLabel: {
    color: "#6f7d84",
    fontSize: 12,
    fontWeight: "600"
  },
  tabLabelActive: {
    color: "#1a2a2f"
  },
  inlineMessage: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  inlineMessageError: {
    backgroundColor: "#fce8e6"
  },
  inlineMessageInfo: {
    backgroundColor: "#e7f1f6"
  },
  inlineMessageText: {
    color: "#24333a",
    fontSize: 13
  }
});
