import { randomBytes, randomUUID } from "node:crypto";

import { sql } from "./db";

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

interface DashboardOverviewRow {
  active_salons: string;
  suspended_salons: string;
  expired_salons: string;
  salon_owners: string;
  customers: string;
  appointments: string;
  reviews: string;
}

export interface DashboardOverview {
  activeSalons: number;
  suspendedSalons: number;
  expiredSalons: number;
  salonOwners: number;
  customers: number;
  appointments: number;
  reviews: number;
}

export interface SalonListItem {
  id: string;
  tenantKey: string;
  name: string;
  status: "active" | "suspended" | "expired";
  environmentMode: "demo" | "production";
  demoEnabled: boolean;
  billingEmail: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  subscriptionStatus: string | null;
  appointmentsCount: number;
  customersCount: number;
  updatedAt: string;
}

export interface SalonDetail {
  id: string;
  tenantKey: string;
  name: string;
  commercialName: string;
  status: "active" | "suspended" | "expired";
  environmentMode: "demo" | "production";
  demoEnabled: boolean;
  billingEmail: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  createdAt: string;
  branding: {
    appDisplayName: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string | null;
  } | null;
  appConfig: {
    appName: string;
    appSlug: string;
    iosBundleId: string;
    androidPackageName: string;
    releaseChannel: string;
  } | null;
  demoConfig: {
    environmentMode: "demo" | "production";
    demoExpiresAt: string | null;
    bookingEnabled: boolean;
    notificationsSuppressed: boolean;
    demoBannerText: string | null;
  } | null;
  featureFlags: Array<{
    id: string;
    flagKey: string;
    isEnabled: boolean;
  }>;
  owners: Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    isPrimary: boolean;
  }>;
  recentAuditLogs: Array<{
    id: string;
    actorRole: string;
    action: string;
    entityType: string;
    createdAt: string;
  }>;
  recentAccessLogs: Array<{
    id: string;
    actorRole: string | null;
    accessChannel: string;
    email: string | null;
    success: boolean;
    failureReason: string | null;
    createdAt: string;
  }>;
}

export interface RecentLogItem {
  id: string;
  tenantKey: string | null;
  salonName: string | null;
  kind: "audit" | "access";
  label: string;
  actorRole: string | null;
  createdAt: string;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const result = await sql<DashboardOverviewRow>(`
    select
      count(*) filter (where status = 'active')::text as active_salons,
      count(*) filter (where status = 'suspended')::text as suspended_salons,
      count(*) filter (where status = 'expired')::text as expired_salons,
      (select count(*)::text from public.salon_owners) as salon_owners,
      (select count(*)::text from public.customers) as customers,
      (select count(*)::text from public.appointments) as appointments,
      (select count(*)::text from public.reviews) as reviews
    from public.salons
  `);

  const row = result.rows[0];

  return {
    activeSalons: Number(row.active_salons),
    suspendedSalons: Number(row.suspended_salons),
    expiredSalons: Number(row.expired_salons),
    salonOwners: Number(row.salon_owners),
    customers: Number(row.customers),
    appointments: Number(row.appointments),
    reviews: Number(row.reviews)
  };
}

export async function getSalons(): Promise<SalonListItem[]> {
  const result = await sql<{
    id: string;
    tenant_key: string;
    name: string;
    status: SalonListItem["status"];
    environment_mode: SalonListItem["environmentMode"];
    demo_enabled: boolean;
    billing_email: string | null;
    owner_name: string | null;
    owner_email: string | null;
    subscription_status: string | null;
    appointments_count: string;
    customers_count: string;
    updated_at: string;
  }>(`
    select
      s.id,
      s.tenant_key,
      s.name,
      s.status,
      s.environment_mode,
      s.demo_enabled,
      s.billing_email,
      concat_ws(' ', so.first_name, so.last_name) as owner_name,
      so.email as owner_email,
      ss.status::text as subscription_status,
      count(distinct a.id)::text as appointments_count,
      count(distinct c.id)::text as customers_count,
      s.updated_at::text
    from public.salons s
    left join public.salon_owners so
      on so.salon_id = s.id
      and so.is_primary = true
    left join lateral (
      select status
      from public.salon_subscriptions
      where salon_id = s.id
      order by created_at desc
      limit 1
    ) ss on true
    left join public.appointments a on a.salon_id = s.id
    left join public.customers c on c.salon_id = s.id
    group by
      s.id,
      so.first_name,
      so.last_name,
      so.email,
      ss.status
    order by s.created_at asc
  `);

  return result.rows.map((row) => ({
    id: row.id,
    tenantKey: row.tenant_key,
    name: row.name,
    status: row.status,
    environmentMode: row.environment_mode,
    demoEnabled: row.demo_enabled,
    billingEmail: row.billing_email,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    subscriptionStatus: row.subscription_status,
    appointmentsCount: Number(row.appointments_count),
    customersCount: Number(row.customers_count),
    updatedAt: row.updated_at
  }));
}

export async function getSalonDetail(salonId: string): Promise<SalonDetail | null> {
  const base = await sql<{
    id: string;
    tenant_key: string;
    name: string;
    commercial_name: string;
    status: SalonDetail["status"];
    environment_mode: SalonDetail["environmentMode"];
    demo_enabled: boolean;
    billing_email: string | null;
    phone: string | null;
    city: string | null;
    province: string | null;
    created_at: string;
    branding: JsonValue | null;
    app_config: JsonValue | null;
    demo_config: JsonValue | null;
  }>(
    `
      select
        s.id,
        s.tenant_key,
        s.name,
        s.commercial_name,
        s.status,
        s.environment_mode,
        s.demo_enabled,
        s.billing_email,
        s.phone,
        s.city,
        s.province,
        s.created_at::text,
        (
          select json_build_object(
            'appDisplayName', sb.app_display_name,
            'primaryColor', sb.primary_color,
            'secondaryColor', sb.secondary_color,
            'accentColor', sb.accent_color
          )
          from public.salon_branding sb
          where sb.salon_id = s.id
        ) as branding,
        (
          select json_build_object(
            'appName', sac.app_name,
            'appSlug', sac.app_slug,
            'iosBundleId', sac.ios_bundle_id,
            'androidPackageName', sac.android_package_name,
            'releaseChannel', sac.release_channel
          )
          from public.salon_app_configs sac
          where sac.salon_id = s.id
        ) as app_config,
        (
          select json_build_object(
            'environmentMode', sdc.environment_mode,
            'demoExpiresAt', sdc.demo_expires_at,
            'bookingEnabled', sdc.booking_enabled,
            'notificationsSuppressed', sdc.notifications_suppressed,
            'demoBannerText', sdc.demo_banner_text
          )
          from public.salon_demo_configs sdc
          where sdc.salon_id = s.id
        ) as demo_config
      from public.salons s
      where s.id = $1
      limit 1
    `,
    [salonId]
  );

  if (!base.rows[0]) {
    return null;
  }

  const [featureFlags, owners, recentAuditLogs, recentAccessLogs] = await Promise.all([
    sql<{ id: string; flag_key: string; is_enabled: boolean }>(
      `
        select id, flag_key, is_enabled
        from public.salon_feature_flags
        where salon_id = $1
        order by flag_key asc
      `,
      [salonId]
    ),
    sql<{ id: string; first_name: string; last_name: string; email: string; phone: string | null; is_primary: boolean }>(
      `
        select id, first_name, last_name, email, phone, is_primary
        from public.salon_owners
        where salon_id = $1
        order by is_primary desc, created_at asc
      `,
      [salonId]
    ),
    sql<{ id: string; actor_role: string; action: string; entity_type: string; created_at: string }>(
      `
        select id, actor_role::text, action, entity_type, created_at::text
        from public.audit_logs
        where salon_id = $1
        order by created_at desc
        limit 6
      `,
      [salonId]
    ),
    sql<{ id: string; actor_role: string | null; access_channel: string; email: string | null; success: boolean; failure_reason: string | null; created_at: string }>(
      `
        select
          id,
          actor_role::text,
          access_channel::text,
          email,
          success,
          failure_reason,
          created_at::text
        from public.access_logs
        where salon_id = $1
        order by created_at desc
        limit 6
      `,
      [salonId]
    )
  ]);

  const row = base.rows[0];

  return {
    id: row.id,
    tenantKey: row.tenant_key,
    name: row.name,
    commercialName: row.commercial_name,
    status: row.status,
    environmentMode: row.environment_mode,
    demoEnabled: row.demo_enabled,
    billingEmail: row.billing_email,
    phone: row.phone,
    city: row.city,
    province: row.province,
    createdAt: row.created_at,
    branding: row.branding as SalonDetail["branding"],
    appConfig: row.app_config as SalonDetail["appConfig"],
    demoConfig: row.demo_config as SalonDetail["demoConfig"],
    featureFlags: featureFlags.rows.map((item) => ({
      id: item.id,
      flagKey: item.flag_key,
      isEnabled: item.is_enabled
    })),
    owners: owners.rows.map((item) => ({
      id: item.id,
      fullName: `${item.first_name} ${item.last_name}`,
      email: item.email,
      phone: item.phone,
      isPrimary: item.is_primary
    })),
    recentAuditLogs: recentAuditLogs.rows.map((item) => ({
      id: item.id,
      actorRole: item.actor_role,
      action: item.action,
      entityType: item.entity_type,
      createdAt: item.created_at
    })),
    recentAccessLogs: recentAccessLogs.rows.map((item) => ({
      id: item.id,
      actorRole: item.actor_role,
      accessChannel: item.access_channel,
      email: item.email,
      success: item.success,
      failureReason: item.failure_reason,
      createdAt: item.created_at
    }))
  };
}

export async function getRecentLogs(): Promise<RecentLogItem[]> {
  const audit = await sql<{
    id: string;
    tenant_key: string | null;
    salon_name: string | null;
    actor_role: string;
    action: string;
    created_at: string;
  }>(`
    select
      al.id,
      s.tenant_key,
      s.name as salon_name,
      al.actor_role::text,
      al.action,
      al.created_at::text
    from public.audit_logs al
    left join public.salons s on s.id = al.salon_id
    order by al.created_at desc
    limit 5
  `);

  const access = await sql<{
    id: string;
    tenant_key: string | null;
    salon_name: string | null;
    actor_role: string | null;
    access_channel: string;
    success: boolean;
    created_at: string;
  }>(`
    select
      al.id,
      s.tenant_key,
      s.name as salon_name,
      al.actor_role::text,
      al.access_channel::text,
      al.success,
      al.created_at::text
    from public.access_logs al
    left join public.salons s on s.id = al.salon_id
    order by al.created_at desc
    limit 5
  `);

  return [
    ...audit.rows.map((item) => ({
      id: item.id,
      tenantKey: item.tenant_key,
      salonName: item.salon_name,
      kind: "audit" as const,
      label: item.action,
      actorRole: item.actor_role,
      createdAt: item.created_at
    })),
    ...access.rows.map((item) => ({
      id: item.id,
      tenantKey: item.tenant_key,
      salonName: item.salon_name,
      kind: "access" as const,
      label: `${item.access_channel} ${item.success ? "ok" : "failed"}`,
      actorRole: item.actor_role,
      createdAt: item.created_at
    }))
  ]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 8);
}

export async function createSalon(input: {
  name: string;
  tenantKey: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  status: "active" | "suspended" | "expired";
  environmentMode: "demo" | "production";
}) {
  const salonId = randomUUID();
  const ownerAccountId = randomUUID();
  const ownerProfileId = randomUUID();
  const ownerAuthUserId = randomUUID();
  const appConfigId = randomUUID();
  const brandingId = randomUUID();
  const demoConfigId = randomUUID();
  const auditId = randomUUID();

  await sql("begin");

  try {
    await sql(
      `
        insert into public.salons (
          id,
          tenant_key,
          name,
          commercial_name,
          status,
          environment_mode,
          billing_email
        ) values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        salonId,
        input.tenantKey,
        input.name,
        input.name,
        input.status,
        input.environmentMode,
        input.ownerEmail
      ]
    );

    await sql(
      `
        insert into public.salon_accounts (
          id,
          salon_id,
          auth_user_id,
          role,
          email,
          first_name,
          last_name,
          is_primary_owner,
          is_enabled
        ) values ($1, $2, $3, 'salon_owner', $4, $5, $6, true, true)
      `,
      [
        ownerAccountId,
        salonId,
        ownerAuthUserId,
        input.ownerEmail,
        input.ownerFirstName,
        input.ownerLastName
      ]
    );

    await sql(
      `
        insert into public.salon_owners (
          id,
          salon_id,
          salon_account_id,
          first_name,
          last_name,
          email,
          is_primary
        ) values ($1, $2, $3, $4, $5, $6, true)
      `,
      [ownerProfileId, salonId, ownerAccountId, input.ownerFirstName, input.ownerLastName, input.ownerEmail]
    );

    await sql(
      `
        insert into public.salon_branding (
          id,
          salon_id,
          app_display_name,
          salon_display_name,
          primary_color,
          secondary_color
        ) values ($1, $2, $3, $4, '#111111', '#D4AF37')
      `,
      [brandingId, salonId, input.name, input.name]
    );

    await sql(
      `
        insert into public.salon_app_configs (
          id,
          salon_id,
          tenant_key,
          app_name,
          app_slug,
          ios_bundle_id,
          android_package_name,
          deep_link_scheme,
          build_profile,
          release_channel
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', 'draft')
      `,
      [
        appConfigId,
        salonId,
        input.tenantKey,
        input.name,
        input.tenantKey,
        `it.platform.${input.tenantKey.replace(/-/g, "")}`,
        `it.platform.${input.tenantKey.replace(/-/g, "")}`,
        input.tenantKey.replace(/-/g, ""),
      ]
    );

    await sql(
      `
        insert into public.salon_demo_configs (
          id,
          salon_id,
          environment_mode,
          booking_enabled,
          notifications_suppressed,
          seed_template,
          demo_banner_text
        ) values ($1, $2, $3, true, $4, 'default_demo', $5)
      `,
      [
        demoConfigId,
        salonId,
        input.environmentMode,
        input.environmentMode === "demo",
        input.environmentMode === "demo" ? "Demo attiva per presentazione cliente" : null
      ]
    );

    await sql(
      `
        insert into public.audit_logs (
          id,
          salon_id,
          actor_role,
          action,
          entity_type,
          entity_id,
          metadata
        ) values ($1, $2, 'super_admin', 'salon.created_from_admin_panel', 'salons', $3, $4::jsonb)
      `,
      [
        auditId,
        salonId,
        salonId,
        JSON.stringify({
          ownerEmail: input.ownerEmail,
          environmentMode: input.environmentMode
        })
      ]
    );

    await sql("commit");
  } catch (error) {
    await sql("rollback");
    throw error;
  }
}

export async function updateSalonStatus(
  salonId: string,
  status: "active" | "suspended" | "expired"
) {
  await sql(
    `
      update public.salons
      set status = $2
      where id = $1
    `,
    [salonId, status]
  );

  await sql(
    `
      insert into public.salon_status_history (
        id,
        salon_id,
        new_status,
        changed_by_role,
        reason
      ) values ($1, $2, $3, 'super_admin', 'Aggiornamento stato dal pannello super admin')
    `,
    [randomUUID(), salonId, status]
  );

  await logAuditEvent(salonId, "salon.status_updated", {
    status
  });
}

export async function updateSalonEnvironmentMode(
  salonId: string,
  environmentMode: "demo" | "production"
) {
  await sql(
    `
      update public.salon_demo_configs
      set environment_mode = $2,
          demo_banner_text = case when $2 = 'demo' then 'Demo attiva per presentazione cliente' else null end,
          notifications_suppressed = ($2 = 'demo')
      where salon_id = $1
    `,
    [salonId, environmentMode]
  );

  await logAuditEvent(salonId, "salon.environment_mode_updated", {
    environmentMode
  });
}

export async function toggleFeatureFlag(salonId: string, featureFlagId: string) {
  await sql(
    `
      update public.salon_feature_flags
      set is_enabled = not is_enabled
      where id = $1 and salon_id = $2
    `,
    [featureFlagId, salonId]
  );

  await logAuditEvent(salonId, "salon.feature_flag_toggled", {
    featureFlagId
  });
}

export async function generateOwnerCredentialPack(salonId: string) {
  const ownerResult = await sql<{ email: string }>(
    `
      select email
      from public.salon_owners
      where salon_id = $1
      order by is_primary desc, created_at asc
      limit 1
    `,
    [salonId]
  );

  const ownerEmail = ownerResult.rows[0]?.email ?? "owner@example.com";
  const temporaryPassword = randomBytes(6).toString("base64url");

  await logAuditEvent(salonId, "salon.owner_credentials_generated", {
    ownerEmail
  });

  return {
    ownerEmail,
    temporaryPassword,
    issuedAt: new Date().toISOString()
  };
}

async function logAuditEvent(salonId: string, action: string, metadata: Record<string, JsonValue>) {
  await sql(
    `
      insert into public.audit_logs (
        id,
        salon_id,
        actor_role,
        action,
        entity_type,
        entity_id,
        metadata
      ) values ($1, $2, 'super_admin', $3, 'salons', $2, $4::jsonb)
    `,
    [randomUUID(), salonId, action, JSON.stringify(metadata)]
  );
}
