import { randomUUID } from "node:crypto";

import { dispatchQueuedPushNotifications } from "./push-dispatch";
import { sql } from "./db";

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];
const LOCAL_OWNER_AUTH_ID = "00000000-0000-0000-0000-000000000000";

export interface SalonOverview {
  operators: number;
  services: number;
  customers: number;
  upcomingAppointments: number;
  reviews: number;
}

export interface WaitingListItem {
  id: string;
  requested_date: string;
  requested_start_after: string | null;
  requested_end_before: string | null;
  status: string;
  customer_name: string;
  operator_name: string | null;
  notes: string | null;
}

export interface RecurringBookingItem {
  id: string;
  status: string;
  recurrence_rule: string;
  start_date: string;
  end_date: string | null;
  next_occurrence_at: string | null;
  customer_name: string;
  operator_name: string | null;
  service_names: string | null;
}

export interface NotificationLogItem {
  id: string;
  channel: string;
  event_key: string;
  recipient: string;
  status: string;
  provider_name: string | null;
  created_at: string;
}

export interface ExportJobItem {
  id: string;
  export_type: string;
  file_format: string;
  status: string;
  file_path: string | null;
  created_at: string;
}

export interface AuditTrailItem {
  id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  created_at: string;
  metadata: JsonValue;
}

export interface AccessTrailItem {
  id: string;
  actor_role: string | null;
  email: string | null;
  success: boolean;
  failure_reason: string | null;
  access_channel: string;
  created_at: string;
}

export async function getSalonOverview(salonId: string): Promise<SalonOverview> {
  const result = await sql<{
    operators_count: string;
    services_count: string;
    customers_count: string;
    upcoming_appointments_count: string;
    reviews_count: string;
  }>(
    `
      select
        (select count(*)::text from public.operators where salon_id = $1 and is_active = true) as operators_count,
        (select count(*)::text from public.services where salon_id = $1 and is_active = true) as services_count,
        (select count(*)::text from public.customers where salon_id = $1) as customers_count,
        (
          select count(*)::text
          from public.appointments
          where salon_id = $1
            and start_at >= timezone('utc', now())
            and status in ('pending', 'confirmed')
        ) as upcoming_appointments_count,
        (select count(*)::text from public.reviews where salon_id = $1) as reviews_count
    `,
    [salonId]
  );

  const row = result.rows[0];

  return {
    operators: Number(row.operators_count),
    services: Number(row.services_count),
    customers: Number(row.customers_count),
    upcomingAppointments: Number(row.upcoming_appointments_count),
    reviews: Number(row.reviews_count)
  };
}

export async function getUpcomingAppointments(salonId: string) {
  const result = await sql<{
    id: string;
    start_at: string;
    end_at: string;
    status: string;
    customer_name: string;
    operator_name: string;
    services_label: string;
  }>(
    `
      select
        a.id,
        a.start_at::text,
        a.end_at::text,
        a.status::text,
        concat_ws(' ', c.first_name, c.last_name) as customer_name,
        o.display_name as operator_name,
        string_agg(aps.service_name_snapshot, ', ' order by aps.sort_order) as services_label
      from public.appointments a
      join public.customers c on c.id = a.customer_id
      join public.operators o on o.id = a.operator_id
      left join public.appointment_services aps on aps.appointment_id = a.id
      where a.salon_id = $1
        and a.start_at >= timezone('utc', now())
      group by a.id, c.first_name, c.last_name, o.display_name
      order by a.start_at asc
      limit 12
    `,
    [salonId]
  );

  return result.rows;
}

export async function getBlockedSlots(salonId: string) {
  const result = await sql<{
    id: string;
    starts_at: string;
    ends_at: string;
    reason: string | null;
    operator_name: string | null;
  }>(
    `
      select
        bs.id,
        bs.starts_at::text,
        bs.ends_at::text,
        bs.reason,
        o.display_name as operator_name
      from public.blocked_slots bs
      left join public.operators o on o.id = bs.operator_id
      where bs.salon_id = $1
      order by bs.starts_at asc
      limit 10
    `,
    [salonId]
  );

  return result.rows;
}

export async function getBusinessHours(salonId: string) {
  const result = await sql<{
    id: string;
    day_of_week: number;
    opens_at: string | null;
    closes_at: string | null;
    break_start_at: string | null;
    break_end_at: string | null;
    is_closed: boolean;
  }>(
    `
      select id, day_of_week, opens_at::text, closes_at::text, break_start_at::text, break_end_at::text, is_closed
      from public.business_hours
      where salon_id = $1 and operator_id is null
      order by day_of_week asc
    `,
    [salonId]
  );

  return result.rows;
}

export async function getOperators(salonId: string) {
  const result = await sql<{
    id: string;
    display_name: string;
    bio: string | null;
    color_hex: string | null;
    is_active: boolean;
  }>(
    `
      select id, display_name, bio, color_hex, is_active
      from public.operators
      where salon_id = $1
      order by sort_order asc, created_at asc
    `,
    [salonId]
  );

  return result.rows;
}

export async function getServiceCategories(salonId: string) {
  const result = await sql<{
    id: string;
    name: string;
  }>(
    `
      select id, name
      from public.service_categories
      where salon_id = $1 and is_active = true
      order by sort_order asc, name asc
    `,
    [salonId]
  );

  return result.rows;
}

export async function getServices(salonId: string) {
  const result = await sql<{
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price_cents: number;
    category_name: string | null;
    operator_names: string | null;
  }>(
    `
      select
        s.id,
        s.name,
        s.description,
        s.duration_minutes,
        s.price_cents,
        sc.name as category_name,
        string_agg(o.display_name, ', ' order by o.display_name) as operator_names
      from public.services s
      left join public.service_categories sc on sc.id = s.category_id
      left join public.service_operator_assignments soa on soa.service_id = s.id
      left join public.operators o on o.id = soa.operator_id
      where s.salon_id = $1
      group by s.id, sc.name
      order by s.created_at asc
    `,
    [salonId]
  );

  return result.rows;
}

export async function getCustomers(salonId: string) {
  const result = await sql<{
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    total_appointments: number | null;
    last_visit_at: string | null;
  }>(
    `
      select
        c.id,
        concat_ws(' ', c.first_name, c.last_name) as full_name,
        c.email,
        c.phone,
        cp.total_appointments,
        cp.last_visit_at::text
      from public.customers c
      left join public.customer_profiles cp on cp.customer_id = c.id
      where c.salon_id = $1
      order by c.created_at asc
    `,
    [salonId]
  );

  return result.rows;
}

export async function getPromotions(salonId: string) {
  const result = await sql<{
    id: string;
    title: string;
    discount_type: string;
    discount_value: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
  }>(
    `
      select id, title, discount_type::text, discount_value::text, starts_at::text, ends_at::text, is_active
      from public.promotions
      where salon_id = $1
      order by created_at desc
    `,
    [salonId]
  );

  return result.rows;
}

export async function getCoupons(salonId: string) {
  const result = await sql<{
    id: string;
    code: string;
    title: string;
    discount_type: string;
    discount_value: string;
    is_active: boolean;
  }>(
    `
      select id, code, title, discount_type::text, discount_value::text, is_active
      from public.coupons
      where salon_id = $1
      order by created_at desc
    `,
    [salonId]
  );

  return result.rows;
}

export async function getPortfolios(salonId: string) {
  const result = await sql<{
    id: string;
    title: string;
    description: string | null;
    is_published: boolean;
  }>(
    `
      select id, title, description, is_published
      from public.portfolios
      where salon_id = $1
      order by sort_order asc, created_at asc
    `,
    [salonId]
  );

  return result.rows;
}

export async function getSalonSettings(salonId: string) {
  const result = await sql<{
    name: string;
    commercial_name: string;
    billing_email: string | null;
    phone: string | null;
    city: string | null;
    province: string | null;
    app_display_name: string | null;
  }>(
    `
      select
        s.name,
        s.commercial_name,
        s.billing_email,
        s.phone,
        s.city,
        s.province,
        sb.app_display_name
      from public.salons s
      left join public.salon_branding sb on sb.salon_id = s.id
      where s.id = $1
      limit 1
    `,
    [salonId]
  );

  return result.rows[0] ?? null;
}

export async function getWaitingListEntries(salonId: string): Promise<WaitingListItem[]> {
  const result = await sql<WaitingListItem>(
    `
      select
        wl.id,
        wl.requested_date::text,
        wl.requested_start_after::text,
        wl.requested_end_before::text,
        wl.status::text,
        concat_ws(' ', c.first_name, c.last_name) as customer_name,
        o.display_name as operator_name,
        wl.notes
      from public.waiting_list wl
      join public.customers c on c.id = wl.customer_id
      left join public.operators o on o.id = wl.operator_id
      where wl.salon_id = $1
      order by wl.created_at desc
      limit 12
    `,
    [salonId]
  );

  return result.rows;
}

export async function getRecurringBookings(salonId: string): Promise<RecurringBookingItem[]> {
  const result = await sql<RecurringBookingItem>(
    `
      select
        rb.id,
        rb.status::text,
        rb.recurrence_rule,
        rb.start_date::text,
        rb.end_date::text,
        rb.next_occurrence_at::text,
        concat_ws(' ', c.first_name, c.last_name) as customer_name,
        o.display_name as operator_name,
        string_agg(s.name, ', ' order by rbs.sort_order) as service_names
      from public.recurring_bookings rb
      join public.customers c on c.id = rb.customer_id
      left join public.operators o on o.id = rb.operator_id
      left join public.recurring_booking_services rbs on rbs.recurring_booking_id = rb.id
      left join public.services s on s.id = rbs.service_id
      where rb.salon_id = $1
      group by rb.id, c.first_name, c.last_name, o.display_name
      order by rb.created_at desc
      limit 12
    `,
    [salonId]
  );

  return result.rows;
}

export async function getNotificationLogs(salonId: string): Promise<NotificationLogItem[]> {
  const result = await sql<NotificationLogItem>(
    `
      select
        id,
        channel::text,
        event_key,
        recipient,
        status::text,
        provider_name,
        created_at::text
      from public.notification_logs
      where salon_id = $1
      order by created_at desc
      limit 20
    `,
    [salonId]
  );

  return result.rows;
}

export async function getExportJobs(salonId: string): Promise<ExportJobItem[]> {
  const result = await sql<ExportJobItem>(
    `
      select
        id,
        export_type,
        file_format::text,
        status::text,
        file_path,
        created_at::text
      from public.export_jobs
      where salon_id = $1
      order by created_at desc
      limit 20
    `,
    [salonId]
  );

  return result.rows;
}

export async function getAuditTrail(salonId: string): Promise<AuditTrailItem[]> {
  const result = await sql<AuditTrailItem>(
    `
      select
        id,
        actor_role::text,
        action,
        entity_type,
        created_at::text,
        metadata
      from public.audit_logs
      where salon_id = $1
      order by created_at desc
      limit 25
    `,
    [salonId]
  );

  return result.rows;
}

export async function getAccessTrail(salonId: string): Promise<AccessTrailItem[]> {
  const result = await sql<AccessTrailItem>(
    `
      select
        id,
        actor_role::text,
        email,
        success,
        failure_reason,
        access_channel::text,
        created_at::text
      from public.access_logs
      where salon_id = $1
      order by created_at desc
      limit 25
    `,
    [salonId]
  );

  return result.rows;
}

export async function addOperator(
  salonId: string,
  input: { displayName: string; bio?: string; colorHex?: string }
) {
  await ensureSalonOperational(salonId);
  const id = randomUUID();

  await sql(
    `
      insert into public.operators (
        id,
        salon_id,
        display_name,
        bio,
        color_hex,
        is_active
      ) values ($1, $2, $3, $4, $5, true)
    `,
    [id, salonId, input.displayName, input.bio ?? null, input.colorHex ?? null]
  );

  await logOwnerAction(salonId, "operator.created", "operators", id, {
    displayName: input.displayName
  });
}

export async function addService(
  salonId: string,
  input: {
    name: string;
    description?: string;
    durationMinutes: number;
    priceCents: number;
    categoryName?: string;
    operatorId?: string;
  }
) {
  await ensureSalonOperational(salonId);
  const serviceId = randomUUID();
  let categoryId: string | null = null;

  if (input.categoryName) {
    const existing = await sql<{ id: string }>(
      `
        select id
        from public.service_categories
        where salon_id = $1 and lower(name) = lower($2)
        limit 1
      `,
      [salonId, input.categoryName]
    );

    if (existing.rows[0]) {
      categoryId = existing.rows[0].id;
    } else {
      categoryId = randomUUID();
      await sql(
        `
          insert into public.service_categories (id, salon_id, name, is_active)
          values ($1, $2, $3, true)
        `,
        [categoryId, salonId, input.categoryName]
      );
    }
  }

  await sql(
    `
      insert into public.services (
        id,
        salon_id,
        category_id,
        name,
        description,
        duration_minutes,
        price_cents,
        buffer_minutes,
        is_active
      ) values ($1, $2, $3, $4, $5, $6, $7, 5, true)
    `,
    [
      serviceId,
      salonId,
      categoryId,
      input.name,
      input.description ?? null,
      input.durationMinutes,
      input.priceCents
    ]
  );

  if (input.operatorId) {
    await sql(
      `
        insert into public.service_operator_assignments (id, salon_id, service_id, operator_id)
        values ($1, $2, $3, $4)
      `,
      [randomUUID(), salonId, serviceId, input.operatorId]
    );
  }

  await logOwnerAction(salonId, "service.created", "services", serviceId, {
    name: input.name
  });
}

export async function addBlockedSlot(
  salonId: string,
  input: { startsAt: string; endsAt: string; reason?: string; operatorId?: string }
) {
  await ensureSalonOperational(salonId);
  const id = randomUUID();

  await sql(
    `
      insert into public.blocked_slots (
        id,
        salon_id,
        operator_id,
        starts_at,
        ends_at,
        reason
      ) values ($1, $2, $3, $4, $5, $6)
    `,
    [id, salonId, input.operatorId ?? null, input.startsAt, input.endsAt, input.reason ?? null]
  );

  await logOwnerAction(salonId, "agenda.blocked_slot_created", "blocked_slots", id, {
    startsAt: input.startsAt,
    endsAt: input.endsAt
  });
}

export async function upsertBusinessHours(
  salonId: string,
  input: {
    dayOfWeek: number;
    opensAt?: string;
    closesAt?: string;
    breakStartAt?: string;
    breakEndAt?: string;
    isClosed: boolean;
  }
) {
  await ensureSalonOperational(salonId);
  await sql(
    `
      insert into public.business_hours (
        id,
        salon_id,
        operator_id,
        day_of_week,
        opens_at,
        closes_at,
        break_start_at,
        break_end_at,
        is_closed
      ) values ($1, $2, null, $3, $4, $5, $6, $7, $8)
      on conflict (salon_id, operator_id, day_of_week)
      do update set
        opens_at = excluded.opens_at,
        closes_at = excluded.closes_at,
        break_start_at = excluded.break_start_at,
        break_end_at = excluded.break_end_at,
        is_closed = excluded.is_closed
    `,
    [
      randomUUID(),
      salonId,
      input.dayOfWeek,
      input.isClosed ? null : input.opensAt ?? null,
      input.isClosed ? null : input.closesAt ?? null,
      input.isClosed ? null : input.breakStartAt ?? null,
      input.isClosed ? null : input.breakEndAt ?? null,
      input.isClosed
    ]
  );

  await logOwnerAction(salonId, "agenda.business_hours_upserted", "business_hours", null, {
    dayOfWeek: input.dayOfWeek,
    isClosed: input.isClosed
  });
}

export async function addPromotion(
  salonId: string,
  input: {
    title: string;
    discountType: "percentage" | "fixed_amount";
    discountValue: number;
    startsAt: string;
    endsAt: string;
  }
) {
  await ensureSalonOperational(salonId);
  const id = randomUUID();

  await sql(
    `
      insert into public.promotions (
        id,
        salon_id,
        title,
        discount_type,
        discount_value,
        starts_at,
        ends_at,
        is_active
      ) values ($1, $2, $3, $4, $5, $6, $7, true)
    `,
    [id, salonId, input.title, input.discountType, input.discountValue, input.startsAt, input.endsAt]
  );

  await logOwnerAction(salonId, "promotion.created", "promotions", id, {
    title: input.title
  });
}

export async function addCoupon(
  salonId: string,
  input: {
    code: string;
    title: string;
    discountType: "percentage" | "fixed_amount";
    discountValue: number;
    startsAt: string;
    endsAt: string;
  }
) {
  await ensureSalonOperational(salonId);
  const id = randomUUID();

  await sql(
    `
      insert into public.coupons (
        id,
        salon_id,
        code,
        title,
        discount_type,
        discount_value,
        starts_at,
        ends_at,
        is_active
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, true)
    `,
    [id, salonId, input.code, input.title, input.discountType, input.discountValue, input.startsAt, input.endsAt]
  );

  await logOwnerAction(salonId, "coupon.created", "coupons", id, {
    code: input.code
  });
}

export async function addPortfolio(
  salonId: string,
  input: { title: string; description?: string }
) {
  await ensureSalonOperational(salonId);
  const id = randomUUID();

  await sql(
    `
      insert into public.portfolios (
        id,
        salon_id,
        title,
        description,
        is_published
      ) values ($1, $2, $3, $4, true)
    `,
    [id, salonId, input.title, input.description ?? null]
  );

  await logOwnerAction(salonId, "portfolio.created", "portfolios", id, {
    title: input.title
  });
}

export async function updateSalonSettings(
  salonId: string,
  input: {
    commercialName: string;
    billingEmail?: string;
    phone?: string;
    city?: string;
    province?: string;
  }
) {
  await ensureSalonOperational(salonId);
  await sql(
    `
      update public.salons
      set
        commercial_name = $2,
        billing_email = $3,
        phone = $4,
        city = $5,
        province = $6
      where id = $1
    `,
    [
      salonId,
      input.commercialName,
      input.billingEmail ?? null,
      input.phone ?? null,
      input.city ?? null,
      input.province ?? null
    ]
  );

  await logOwnerAction(salonId, "salon.settings_updated", "salons", salonId, {
    commercialName: input.commercialName
  });
}

export async function addWaitingListEntry(
  salonId: string,
  input: {
    customerId: string;
    operatorId?: string;
    requestedDate: string;
    requestedStartAfter?: string;
    requestedEndBefore?: string;
    notes?: string;
  }
) {
  await ensureSalonOperational(salonId);
  const id = randomUUID();

  await sql(
    `
      insert into public.waiting_list (
        id,
        salon_id,
        customer_id,
        operator_id,
        requested_date,
        requested_start_after,
        requested_end_before,
        notes,
        status
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
    `,
    [
      id,
      salonId,
      input.customerId,
      input.operatorId ?? null,
      input.requestedDate,
      input.requestedStartAfter ?? null,
      input.requestedEndBefore ?? null,
      input.notes ?? null
    ]
  );

  await logOwnerAction(salonId, "waiting_list.created", "waiting_list", id, {
    requestedDate: input.requestedDate
  });
}

export async function addRecurringBooking(
  salonId: string,
  input: {
    customerId: string;
    operatorId?: string;
    recurrenceRule: string;
    startDate: string;
    endDate?: string;
    notes?: string;
    serviceIds: string[];
  }
) {
  await ensureSalonOperational(salonId);
  const recurringBookingId = randomUUID();

  await sql(
    `
      insert into public.recurring_bookings (
        id,
        salon_id,
        customer_id,
        operator_id,
        status,
        recurrence_rule,
        start_date,
        end_date,
        notes
      ) values ($1, $2, $3, $4, 'active', $5, $6, $7, $8)
    `,
    [
      recurringBookingId,
      salonId,
      input.customerId,
      input.operatorId ?? null,
      input.recurrenceRule,
      input.startDate,
      input.endDate ?? null,
      input.notes ?? null
    ]
  );

  for (const [index, serviceId] of input.serviceIds.entries()) {
    await sql(
      `
        insert into public.recurring_booking_services (
          id,
          salon_id,
          recurring_booking_id,
          service_id,
          sort_order
        ) values ($1, $2, $3, $4, $5)
      `,
      [randomUUID(), salonId, recurringBookingId, serviceId, index]
    );
  }

  await logOwnerAction(salonId, "recurring_booking.created", "recurring_bookings", recurringBookingId, {
    recurrenceRule: input.recurrenceRule,
    serviceCount: input.serviceIds.length
  });
}

export async function queueNotification(
  salonId: string,
  input: {
    customerId?: string;
    appointmentId?: string;
    channel: "email" | "push";
    eventKey: string;
    recipient: string;
    payload: Record<string, JsonValue>;
  }
) {
  await ensureSalonOperational(salonId);
  const notificationId = randomUUID();

  await sql(
    `
      insert into public.notification_logs (
        id,
        salon_id,
        customer_id,
        appointment_id,
        channel,
        event_key,
        recipient,
        payload,
        status,
        provider_name
      ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'queued', 'manual_queue')
    `,
    [
      notificationId,
      salonId,
      input.customerId ?? null,
      input.appointmentId ?? null,
      input.channel,
      input.eventKey,
      input.recipient,
      JSON.stringify(input.payload)
    ]
  );

  await logOwnerAction(salonId, "notification.queued", "notification_logs", notificationId, {
    channel: input.channel,
    eventKey: input.eventKey,
    recipient: input.recipient
  });
}

export async function queueCustomerPushNotification(
  salonId: string,
  input: {
    customerId: string;
    appointmentId?: string;
    eventKey: string;
    title: string;
    body: string;
    payload?: Record<string, JsonValue>;
  }
) {
  await ensureSalonOperational(salonId);

  const result = await sql<{ queued_count: number }>(
    `
      select public.queue_customer_push_notification(
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7::jsonb
      ) as queued_count
    `,
    [
      salonId,
      input.customerId,
      input.eventKey,
      input.title,
      input.body,
      input.appointmentId ?? null,
      JSON.stringify(input.payload ?? {})
    ]
  );

  await logOwnerAction(salonId, "notification.queued", "notification_logs", null, {
    channel: "push",
    eventKey: input.eventKey,
    customerId: input.customerId,
    queuedCount: Number(result.rows[0]?.queued_count ?? 0)
  });

  return Number(result.rows[0]?.queued_count ?? 0);
}

export async function flushQueuedPushNotifications(salonId: string) {
  await ensureSalonOperational(salonId);
  const summary = await dispatchQueuedPushNotifications(salonId);

  await logOwnerAction(salonId, "notification.dispatched", "notification_logs", null, {
    queued: summary.queued,
    sent: summary.sent,
    failed: summary.failed
  });

  return summary;
}

export async function enqueueDuePushReminders(salonId: string) {
  await ensureSalonOperational(salonId);

  const result = await sql<{ queued_count: number }>(
    `
      select public.enqueue_due_push_reminders($1) as queued_count
    `,
    [salonId]
  );

  const queuedCount = Number(result.rows[0]?.queued_count ?? 0);

  await logOwnerAction(salonId, "notification.reminders_enqueued", "notification_logs", null, {
    queuedCount
  });

  return queuedCount;
}

export async function requestExport(
  salonId: string,
  input: { exportType: string; fileFormat: "csv" | "pdf" }
) {
  await ensureSalonOperational(salonId);
  const exportJobId = randomUUID();

  await sql(
    `
      insert into public.export_jobs (
        id,
        salon_id,
        requested_by_auth_user_id,
        requested_by_role,
        export_type,
        file_format,
        status,
        filters
      ) values ($1, $2, $3, 'salon_owner', $4, $5, 'queued', '{}'::jsonb)
    `,
    [exportJobId, salonId, LOCAL_OWNER_AUTH_ID, input.exportType, input.fileFormat]
  );

  await logOwnerAction(salonId, "export.requested", "export_jobs", exportJobId, {
    exportType: input.exportType,
    fileFormat: input.fileFormat
  });
}

async function ensureSalonOperational(salonId: string) {
  const result = await sql<{ status: string }>(
    `
      select status::text
      from public.salons
      where id = $1
      limit 1
    `,
    [salonId]
  );

  const status = result.rows[0]?.status;

  if (status !== "active") {
    throw new Error(`Operazione bloccata: salone non attivo (${status ?? "sconosciuto"}).`);
  }
}

async function logOwnerAction(
  salonId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, JsonValue>
) {
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
      ) values ($1, $2, 'salon_owner', $3, $4, $5, $6::jsonb)
    `,
    [randomUUID(), salonId, action, entityType, entityId, JSON.stringify(metadata)]
  );
}
