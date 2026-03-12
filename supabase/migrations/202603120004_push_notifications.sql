create table public.customer_push_devices (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text,
  device_label text,
  app_version text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customer_push_devices_unique_token unique (salon_id, expo_push_token)
);

alter table public.customer_push_devices
  add constraint customer_push_devices_customer_same_salon_fkey
  foreign key (customer_id, salon_id)
  references public.customers(id, salon_id)
  on delete cascade;

create index customer_push_devices_salon_customer_idx
  on public.customer_push_devices (salon_id, customer_id, is_active);

create index customer_push_devices_auth_idx
  on public.customer_push_devices (auth_user_id, salon_id);

create trigger set_updated_at_customer_push_devices
before update on public.customer_push_devices
for each row execute function public.set_updated_at();

alter table public.customer_push_devices enable row level security;

create policy "customer_push_devices_super_admin_manage"
on public.customer_push_devices
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "customer_push_devices_owner_select"
on public.customer_push_devices
for select
using (public.can_manage_salon(salon_id));

create policy "customer_push_devices_customer_select"
on public.customer_push_devices
for select
using (
  public.can_access_tenant_ops(salon_id)
  and auth.uid() = auth_user_id
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "customer_push_devices_customer_insert"
on public.customer_push_devices
for insert
with check (
  public.can_access_tenant_ops(salon_id)
  and auth.uid() = auth_user_id
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "customer_push_devices_customer_update"
on public.customer_push_devices
for update
using (
  public.can_access_tenant_ops(salon_id)
  and auth.uid() = auth_user_id
  and public.belongs_to_current_customer(salon_id, customer_id)
)
with check (
  public.can_access_tenant_ops(salon_id)
  and auth.uid() = auth_user_id
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create or replace function public.register_customer_push_token(
  p_salon_id uuid,
  p_expo_push_token text,
  p_platform text default null,
  p_device_label text default null,
  p_app_version text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_device_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if not public.is_salon_active(p_salon_id) then
    raise exception 'salon_not_active';
  end if;

  if p_expo_push_token is null or p_expo_push_token !~ '^(ExponentPushToken|ExpoPushToken)\\[[^]]+\\]$' then
    raise exception 'invalid_expo_push_token';
  end if;

  v_customer_id := public.current_customer_id(p_salon_id);

  if v_customer_id is null then
    raise exception 'customer_not_registered';
  end if;

  insert into public.customer_push_devices (
    id,
    salon_id,
    customer_id,
    auth_user_id,
    expo_push_token,
    platform,
    device_label,
    app_version,
    is_active,
    last_seen_at
  )
  values (
    gen_random_uuid(),
    p_salon_id,
    v_customer_id,
    auth.uid(),
    p_expo_push_token,
    nullif(trim(p_platform), ''),
    nullif(trim(p_device_label), ''),
    nullif(trim(p_app_version), ''),
    true,
    timezone('utc', now())
  )
  on conflict (salon_id, expo_push_token)
  do update set
    customer_id = excluded.customer_id,
    auth_user_id = excluded.auth_user_id,
    platform = excluded.platform,
    device_label = excluded.device_label,
    app_version = excluded.app_version,
    is_active = true,
    last_seen_at = timezone('utc', now())
  returning id into v_device_id;

  return v_device_id;
end;
$$;

create or replace function public.deactivate_customer_push_token(
  p_salon_id uuid,
  p_expo_push_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  v_customer_id := public.current_customer_id(p_salon_id);

  if v_customer_id is null then
    raise exception 'customer_not_registered';
  end if;

  update public.customer_push_devices
  set
    is_active = false,
    last_seen_at = timezone('utc', now())
  where salon_id = p_salon_id
    and customer_id = v_customer_id
    and auth_user_id = auth.uid()
    and expo_push_token = p_expo_push_token;

  return found;
end;
$$;

create or replace function public.queue_customer_push_notification(
  p_salon_id uuid,
  p_customer_id uuid,
  p_event_key text,
  p_title text,
  p_body text,
  p_appointment_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_count integer := 0;
  v_notifications_suppressed boolean := false;
begin
  if not public.is_salon_active(p_salon_id) then
    return 0;
  end if;

  select coalesce(sdc.notifications_suppressed, false)
  into v_notifications_suppressed
  from public.salons s
  left join public.salon_demo_configs sdc on sdc.salon_id = s.id
  where s.id = p_salon_id
  limit 1;

  if v_notifications_suppressed then
    return 0;
  end if;

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
  )
  select
    gen_random_uuid(),
    p_salon_id,
    p_customer_id,
    p_appointment_id,
    'push',
    p_event_key,
    cpd.expo_push_token,
    jsonb_build_object(
      'title', p_title,
      'body', p_body,
      'data',
        coalesce(p_payload, '{}'::jsonb)
        || jsonb_build_object(
          'eventKey', p_event_key,
          'salonId', p_salon_id,
          'customerId', p_customer_id,
          'appointmentId', p_appointment_id
        )
    ),
    'queued',
    'expo'
  from public.customer_push_devices cpd
  where cpd.salon_id = p_salon_id
    and cpd.customer_id = p_customer_id
    and cpd.is_active = true;

  get diagnostics v_inserted_count = row_count;
  return coalesce(v_inserted_count, 0);
end;
$$;

create or replace function public.create_customer_appointment(
  p_salon_id uuid,
  p_operator_id uuid,
  p_start_at timestamptz,
  p_service_ids uuid[],
  p_notes text default null,
  p_coupon_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_appointment_id uuid;
  v_total_duration integer;
  v_total_price integer;
  v_service_count integer;
  v_buffer_minutes integer := 5;
  v_end_at timestamptz;
  v_salon_name text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if not public.is_salon_active(p_salon_id) then
    raise exception 'salon_not_active';
  end if;

  if coalesce(array_length(p_service_ids, 1), 0) = 0 then
    raise exception 'services_required';
  end if;

  v_customer_id := public.current_customer_id(p_salon_id);

  if v_customer_id is null then
    raise exception 'customer_not_registered';
  end if;

  if not exists (
    select 1
    from public.operators o
    where o.id = p_operator_id
      and o.salon_id = p_salon_id
      and o.is_active = true
  ) then
    raise exception 'invalid_operator';
  end if;

  select
    coalesce(sum(s.duration_minutes), 0),
    coalesce(sum(s.price_cents), 0),
    count(*)
  into v_total_duration, v_total_price, v_service_count
  from public.services s
  where s.salon_id = p_salon_id
    and s.is_active = true
    and s.id = any(p_service_ids);

  if v_service_count <> array_length(p_service_ids, 1) then
    raise exception 'invalid_services';
  end if;

  if exists (
    select 1
    from unnest(p_service_ids) as selected_service_id
    where not exists (
      select 1
      from public.service_operator_assignments soa
      where soa.salon_id = p_salon_id
        and soa.service_id = selected_service_id
        and soa.operator_id = p_operator_id
    )
  ) then
    raise exception 'operator_not_enabled_for_service';
  end if;

  v_end_at := p_start_at + make_interval(mins => v_total_duration + v_buffer_minutes);

  insert into public.appointments (
    id,
    salon_id,
    customer_id,
    operator_id,
    coupon_id,
    status,
    scheduled_date,
    start_at,
    end_at,
    buffer_minutes,
    total_duration_minutes,
    total_price_cents,
    notes,
    booked_by_role,
    slot_range
  )
  values (
    gen_random_uuid(),
    p_salon_id,
    v_customer_id,
    p_operator_id,
    p_coupon_id,
    'pending',
    (p_start_at at time zone 'UTC')::date,
    p_start_at,
    v_end_at,
    v_buffer_minutes,
    v_total_duration,
    v_total_price,
    p_notes,
    'customer',
    tstzrange(p_start_at, v_end_at, '[)')
  )
  returning id into v_appointment_id;

  insert into public.appointment_services (
    id,
    salon_id,
    appointment_id,
    service_id,
    service_name_snapshot,
    price_cents_snapshot,
    duration_minutes_snapshot,
    sort_order
  )
  select
    gen_random_uuid(),
    p_salon_id,
    v_appointment_id,
    s.id,
    s.name,
    s.price_cents,
    s.duration_minutes,
    ordered_services.ordinality - 1
  from unnest(p_service_ids) with ordinality as ordered_services(service_id, ordinality)
  join public.services s on s.id = ordered_services.service_id;

  insert into public.audit_logs (
    id,
    salon_id,
    actor_auth_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    gen_random_uuid(),
    p_salon_id,
    auth.uid(),
    'customer',
    'appointment.created',
    'appointments',
    v_appointment_id,
    jsonb_build_object('service_count', array_length(p_service_ids, 1))
  );

  select s.name
  into v_salon_name
  from public.salons s
  where s.id = p_salon_id
  limit 1;

  perform public.queue_customer_push_notification(
    p_salon_id,
    v_customer_id,
    'appointment.confirmed',
    'Prenotazione ricevuta',
    format(
      '%s ha ricevuto la tua richiesta del %s.',
      coalesce(v_salon_name, 'Il salone'),
      to_char(p_start_at at time zone 'Europe/Rome', 'DD/MM HH24:MI')
    ),
    v_appointment_id,
    jsonb_build_object('screen', 'appointments')
  );

  return v_appointment_id;
end;
$$;

create or replace function public.reschedule_customer_appointment(
  p_appointment_id uuid,
  p_operator_id uuid,
  p_start_at timestamptz,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id uuid;
  v_customer_id uuid;
  v_total_duration integer;
  v_buffer_minutes integer;
  v_end_at timestamptz;
  v_salon_name text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select
    a.salon_id,
    a.customer_id,
    a.total_duration_minutes,
    a.buffer_minutes
  into v_salon_id, v_customer_id, v_total_duration, v_buffer_minutes
  from public.appointments a
  where a.id = p_appointment_id
    and a.status in ('pending', 'confirmed')
  limit 1;

  if v_salon_id is null then
    raise exception 'appointment_not_found';
  end if;

  if not public.is_salon_active(v_salon_id) then
    raise exception 'salon_not_active';
  end if;

  if public.current_customer_id(v_salon_id) <> v_customer_id then
    raise exception 'appointment_not_owned';
  end if;

  if not exists (
    select 1
    from public.operators o
    where o.id = p_operator_id
      and o.salon_id = v_salon_id
      and o.is_active = true
  ) then
    raise exception 'invalid_operator';
  end if;

  if exists (
    select 1
    from public.appointment_services aps
    where aps.appointment_id = p_appointment_id
      and not exists (
        select 1
        from public.service_operator_assignments soa
        where soa.salon_id = v_salon_id
          and soa.service_id = aps.service_id
          and soa.operator_id = p_operator_id
      )
  ) then
    raise exception 'operator_not_enabled_for_service';
  end if;

  v_end_at := p_start_at + make_interval(mins => v_total_duration + v_buffer_minutes);

  update public.appointments
  set
    operator_id = p_operator_id,
    scheduled_date = (p_start_at at time zone 'UTC')::date,
    start_at = p_start_at,
    end_at = v_end_at,
    notes = coalesce(p_notes, notes),
    status = 'pending',
    slot_range = tstzrange(p_start_at, v_end_at, '[)')
  where id = p_appointment_id;

  insert into public.audit_logs (
    id,
    salon_id,
    actor_auth_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    gen_random_uuid(),
    v_salon_id,
    auth.uid(),
    'customer',
    'appointment.rescheduled',
    'appointments',
    p_appointment_id,
    jsonb_build_object('operator_id', p_operator_id)
  );

  select s.name
  into v_salon_name
  from public.salons s
  where s.id = v_salon_id
  limit 1;

  perform public.queue_customer_push_notification(
    v_salon_id,
    v_customer_id,
    'appointment.updated',
    'Prenotazione modificata',
    format(
      '%s ha aggiornato la prenotazione al %s.',
      coalesce(v_salon_name, 'Il salone'),
      to_char(p_start_at at time zone 'Europe/Rome', 'DD/MM HH24:MI')
    ),
    p_appointment_id,
    jsonb_build_object('screen', 'appointments')
  );

  return p_appointment_id;
end;
$$;

create or replace function public.cancel_customer_appointment(p_appointment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id uuid;
  v_customer_id uuid;
  v_start_at timestamptz;
  v_salon_name text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select a.salon_id, a.customer_id, a.start_at
  into v_salon_id, v_customer_id, v_start_at
  from public.appointments a
  where a.id = p_appointment_id
    and a.status in ('pending', 'confirmed')
  limit 1;

  if v_salon_id is null then
    raise exception 'appointment_not_found';
  end if;

  if public.current_customer_id(v_salon_id) <> v_customer_id then
    raise exception 'appointment_not_owned';
  end if;

  update public.appointments
  set status = 'cancelled_by_customer'
  where id = p_appointment_id;

  insert into public.audit_logs (
    id,
    salon_id,
    actor_auth_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    gen_random_uuid(),
    v_salon_id,
    auth.uid(),
    'customer',
    'appointment.cancelled_by_customer',
    'appointments',
    p_appointment_id,
    '{}'::jsonb
  );

  select s.name
  into v_salon_name
  from public.salons s
  where s.id = v_salon_id
  limit 1;

  perform public.queue_customer_push_notification(
    v_salon_id,
    v_customer_id,
    'appointment.cancelled',
    'Prenotazione annullata',
    format(
      'La prenotazione presso %s del %s e stata annullata.',
      coalesce(v_salon_name, 'il salone'),
      to_char(v_start_at at time zone 'Europe/Rome', 'DD/MM HH24:MI')
    ),
    p_appointment_id,
    jsonb_build_object('screen', 'appointments')
  );

  return p_appointment_id;
end;
$$;

revoke all on function public.register_customer_push_token(uuid, text, text, text, text) from public;
grant execute on function public.register_customer_push_token(uuid, text, text, text, text) to authenticated;

revoke all on function public.deactivate_customer_push_token(uuid, text) from public;
grant execute on function public.deactivate_customer_push_token(uuid, text) to authenticated;

revoke all on function public.queue_customer_push_notification(uuid, uuid, text, text, text, uuid, jsonb) from public;
grant execute on function public.queue_customer_push_notification(uuid, uuid, text, text, text, uuid, jsonb) to authenticated;
