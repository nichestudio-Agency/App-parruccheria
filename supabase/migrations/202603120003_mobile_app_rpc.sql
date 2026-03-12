create or replace function public.get_tenant_bootstrap(p_tenant_key text)
returns table (
  salon_id uuid,
  tenant_key text,
  salon_name text,
  app_display_name text,
  primary_color text,
  secondary_color text,
  status public.salon_status,
  environment_mode public.environment_mode,
  demo_enabled boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id as salon_id,
    s.tenant_key,
    s.name as salon_name,
    sb.app_display_name,
    sb.primary_color,
    sb.secondary_color,
    s.status,
    coalesce(sd.environment_mode, s.environment_mode) as environment_mode,
    s.demo_enabled
  from public.salons s
  left join public.salon_branding sb on sb.salon_id = s.id
  left join public.salon_demo_configs sd on sd.salon_id = s.id
  where s.tenant_key = p_tenant_key
  limit 1;
$$;

create or replace function public.register_customer_membership(
  p_salon_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text default null,
  p_date_of_birth date default null,
  p_privacy_granted boolean default true,
  p_marketing_granted boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_customer_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if not public.is_salon_active(p_salon_id) then
    raise exception 'salon_not_active';
  end if;

  select c.id
  into v_customer_id
  from public.customers c
  where c.salon_id = p_salon_id
    and c.auth_user_id = auth.uid()
  limit 1;

  if v_customer_id is not null then
    return v_customer_id;
  end if;

  insert into public.salon_accounts (
    id,
    salon_id,
    auth_user_id,
    role,
    email,
    first_name,
    last_name,
    phone,
    is_primary_owner,
    is_enabled
  )
  values (
    gen_random_uuid(),
    p_salon_id,
    auth.uid(),
    'customer',
    lower(p_email),
    p_first_name,
    p_last_name,
    p_phone,
    false,
    true
  )
  on conflict (salon_id, auth_user_id)
  do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    is_enabled = true
  returning id into v_account_id;

  insert into public.customers (
    id,
    salon_id,
    salon_account_id,
    auth_user_id,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth
  )
  values (
    gen_random_uuid(),
    p_salon_id,
    v_account_id,
    auth.uid(),
    p_first_name,
    p_last_name,
    lower(p_email),
    p_phone,
    p_date_of_birth
  )
  on conflict (salon_id, auth_user_id)
  do update set
    salon_account_id = excluded.salon_account_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    email = excluded.email,
    phone = excluded.phone,
    date_of_birth = excluded.date_of_birth
  returning id into v_customer_id;

  insert into public.customer_profiles (
    id,
    salon_id,
    customer_id,
    preferences
  )
  values (
    gen_random_uuid(),
    p_salon_id,
    v_customer_id,
    jsonb_build_object('tags', jsonb_build_array())
  )
  on conflict (customer_id) do nothing;

  insert into public.consent_records (
    id,
    salon_id,
    customer_id,
    consent_type,
    granted,
    source
  )
  values
    (gen_random_uuid(), p_salon_id, v_customer_id, 'privacy', p_privacy_granted, 'mobile_signup'),
    (gen_random_uuid(), p_salon_id, v_customer_id, 'marketing', p_marketing_granted, 'mobile_signup');

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
    'customer.self_registered',
    'customers',
    v_customer_id,
    jsonb_build_object('email', lower(p_email))
  );

  return v_customer_id;
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
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select a.salon_id, a.customer_id
  into v_salon_id, v_customer_id
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

  return p_appointment_id;
end;
$$;

revoke all on function public.get_tenant_bootstrap(text) from public;
grant execute on function public.get_tenant_bootstrap(text) to anon, authenticated;

revoke all on function public.register_customer_membership(uuid, text, text, text, text, date, boolean, boolean) from public;
grant execute on function public.register_customer_membership(uuid, text, text, text, text, date, boolean, boolean) to authenticated;

revoke all on function public.create_customer_appointment(uuid, uuid, timestamptz, uuid[], text, uuid) from public;
grant execute on function public.create_customer_appointment(uuid, uuid, timestamptz, uuid[], text, uuid) to authenticated;

revoke all on function public.reschedule_customer_appointment(uuid, uuid, timestamptz, text) from public;
grant execute on function public.reschedule_customer_appointment(uuid, uuid, timestamptz, text) to authenticated;

revoke all on function public.cancel_customer_appointment(uuid) from public;
grant execute on function public.cancel_customer_appointment(uuid) to authenticated;
