create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.salon_status as enum ('active', 'suspended', 'expired');
create type public.environment_mode as enum ('demo', 'production');
create type public.subscription_status as enum ('trial', 'active', 'suspended', 'expired', 'cancelled');
create type public.app_role as enum ('super_admin', 'salon_owner', 'customer');
create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled_by_customer',
  'cancelled_by_salon',
  'no_show'
);
create type public.notification_channel as enum ('email', 'push');
create type public.notification_status as enum ('queued', 'sent', 'failed');
create type public.consent_type as enum ('privacy', 'marketing');
create type public.audit_actor_type as enum ('super_admin', 'salon_owner', 'customer', 'system');
create type public.discount_type as enum ('percentage', 'fixed_amount');
create type public.waiting_list_status as enum ('active', 'notified', 'booked', 'cancelled', 'expired');
create type public.recurring_booking_status as enum ('active', 'paused', 'cancelled', 'completed');
create type public.access_channel as enum ('web', 'mobile', 'api');
create type public.export_file_format as enum ('csv', 'pdf');
create type public.export_job_status as enum ('queued', 'processing', 'completed', 'failed');
create type public.build_target as enum ('ios', 'android', 'all');
create type public.build_job_status as enum ('queued', 'running', 'completed', 'failed');
create type public.asset_kind as enum ('logo', 'icon', 'splash', 'gallery', 'portfolio', 'document', 'other');
create type public.billing_cycle as enum ('monthly', 'quarterly', 'annual');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_salons_demo_enabled()
returns trigger
language plpgsql
as $$
begin
  new.demo_enabled = (new.environment_mode = 'demo');
  return new;
end;
$$;

create or replace function public.sync_salon_demo_mode()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'salons' then
    update public.salon_demo_configs
    set environment_mode = new.environment_mode,
        updated_at = timezone('utc', now())
    where salon_id = new.id
      and environment_mode is distinct from new.environment_mode;
    return new;
  end if;

  if tg_table_name = 'salon_demo_configs' then
    update public.salons
    set environment_mode = new.environment_mode,
        demo_enabled = (new.environment_mode = 'demo'),
        updated_at = timezone('utc', now())
    where id = new.salon_id
      and (
        environment_mode is distinct from new.environment_mode
        or demo_enabled is distinct from (new.environment_mode = 'demo')
      );
    return new;
  end if;

  return new;
end;
$$;

create or replace function public.set_appointment_slot_range()
returns trigger
language plpgsql
as $$
begin
  new.slot_range := tstzrange(
    new.start_at,
    new.end_at + (new.buffer_minutes * interval '1 minute'),
    '[)'
  );
  return new;
end;
$$;

create table public.super_admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  email text not null unique,
  full_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null unique,
  name text not null,
  commercial_name text not null,
  legal_name text,
  status public.salon_status not null default 'active',
  environment_mode public.environment_mode not null default 'production',
  demo_enabled boolean not null default false,
  billing_email text,
  phone text,
  vat_number text,
  tax_code text,
  address_line_1 text,
  address_line_2 text,
  city text,
  province text,
  postal_code text,
  country_code text not null default 'IT',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint salons_tenant_key_format check (tenant_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.salon_accounts (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  auth_user_id uuid not null,
  role public.app_role not null,
  email text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  is_primary_owner boolean not null default false,
  is_enabled boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint salon_accounts_role_check check (role in ('salon_owner', 'customer')),
  constraint salon_accounts_unique_auth_per_salon unique (salon_id, auth_user_id),
  constraint salon_accounts_unique_email_per_salon unique (salon_id, email)
);

create table public.salon_subscriptions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  status public.subscription_status not null,
  billing_cycle public.billing_cycle not null,
  monthly_fee_cents integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  trial_ends_at timestamptz,
  next_billing_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint salon_subscriptions_monthly_fee_non_negative check (monthly_fee_cents >= 0),
  constraint salon_subscriptions_dates_check check (ends_at is null or ends_at > starts_at)
);

create table public.salon_status_history (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  previous_status public.salon_status,
  new_status public.salon_status not null,
  changed_by_auth_user_id uuid,
  changed_by_role public.audit_actor_type not null,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.salon_branding (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null unique references public.salons(id) on delete cascade,
  app_display_name text not null,
  salon_display_name text not null,
  primary_color text not null,
  secondary_color text not null,
  accent_color text,
  logo_asset_path text,
  app_icon_asset_path text,
  splash_asset_path text,
  theme_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint salon_branding_primary_color_hex check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint salon_branding_secondary_color_hex check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint salon_branding_accent_color_hex check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

create table public.salon_app_configs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null unique references public.salons(id) on delete cascade,
  tenant_key text not null unique,
  app_name text not null,
  app_slug text not null unique,
  ios_bundle_id text not null unique,
  android_package_name text not null unique,
  deep_link_scheme text not null unique,
  expo_project_id text,
  build_profile text not null default 'production',
  release_channel text not null default 'production',
  runtime_version_policy text not null default 'appVersion',
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.salon_demo_configs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null unique references public.salons(id) on delete cascade,
  environment_mode public.environment_mode not null default 'demo',
  demo_expires_at timestamptz,
  demo_banner_text text,
  booking_enabled boolean not null default true,
  notifications_suppressed boolean not null default true,
  seed_template text not null default 'default_demo',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.salon_feature_flags (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  flag_key text not null,
  is_enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint salon_feature_flags_unique unique (salon_id, flag_key)
);

create table public.salon_owners (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  salon_account_id uuid not null unique,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  is_primary boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.operators (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  display_name text not null,
  bio text,
  color_hex text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint operators_color_hex check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_categories_unique_name unique (salon_id, name)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  category_id uuid,
  name text not null,
  description text,
  duration_minutes integer not null,
  price_cents integer not null,
  buffer_minutes integer not null default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint services_duration_positive check (duration_minutes > 0),
  constraint services_price_non_negative check (price_cents >= 0),
  constraint services_buffer_non_negative check (buffer_minutes >= 0),
  constraint services_unique_name unique (salon_id, name)
);

create table public.service_operator_assignments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  service_id uuid not null,
  operator_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint service_operator_assignments_unique unique (salon_id, service_id, operator_id)
);

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  operator_id uuid,
  day_of_week integer not null,
  opens_at time,
  closes_at time,
  break_start_at time,
  break_end_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_hours_day_of_week check (day_of_week between 0 and 6),
  constraint business_hours_time_window check (
    is_closed
    or (opens_at is not null and closes_at is not null and closes_at > opens_at)
  ),
  constraint business_hours_break_window check (
    break_start_at is null
    or (break_end_at is not null and opens_at is not null and closes_at is not null and break_start_at >= opens_at and break_end_at <= closes_at and break_end_at > break_start_at)
  )
);

create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  operator_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by_auth_user_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint blocked_slots_window check (ends_at > starts_at)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  salon_account_id uuid unique,
  auth_user_id uuid not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  notes text,
  preferred_operator_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customers_unique_auth_per_salon unique (salon_id, auth_user_id),
  constraint customers_unique_email_per_salon unique (salon_id, email)
);

create table public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null unique,
  preferences jsonb not null default '{}'::jsonb,
  internal_notes text,
  last_visit_at timestamptz,
  total_appointments integer not null default 0,
  no_show_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customer_profiles_total_appointments_non_negative check (total_appointments >= 0),
  constraint customer_profiles_no_show_non_negative check (no_show_count >= 0)
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null,
  consent_type public.consent_type not null,
  granted boolean not null,
  source text not null,
  captured_at timestamptz not null default timezone('utc', now()),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  title text not null,
  description text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  portfolio_id uuid not null,
  asset_path text not null,
  alt_text text,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  title text not null,
  description text,
  discount_type public.discount_type not null,
  discount_value numeric(10,2) not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint promotions_discount_value_positive check (discount_value > 0),
  constraint promotions_window check (ends_at > starts_at)
);

create table public.promotion_services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  promotion_id uuid not null,
  service_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint promotion_services_unique unique (salon_id, promotion_id, service_id)
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  promotion_id uuid,
  code text not null,
  title text not null,
  description text,
  discount_type public.discount_type not null,
  discount_value numeric(10,2) not null,
  usage_limit_total integer,
  usage_limit_per_customer integer,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint coupons_discount_value_positive check (discount_value > 0),
  constraint coupons_usage_limit_total_positive check (usage_limit_total is null or usage_limit_total > 0),
  constraint coupons_usage_limit_per_customer_positive check (usage_limit_per_customer is null or usage_limit_per_customer > 0),
  constraint coupons_window check (ends_at > starts_at),
  constraint coupons_unique_code unique (salon_id, code)
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  coupon_id uuid not null,
  customer_id uuid not null,
  appointment_id uuid,
  redeemed_at timestamptz not null default timezone('utc', now()),
  discount_amount numeric(10,2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint coupon_redemptions_discount_amount_non_negative check (discount_amount >= 0)
);

create table public.recurring_bookings (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null,
  operator_id uuid,
  status public.recurring_booking_status not null default 'active',
  recurrence_rule text not null,
  next_occurrence_at timestamptz,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recurring_bookings_date_window check (end_date is null or end_date >= start_date)
);

create table public.recurring_booking_services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  recurring_booking_id uuid not null,
  service_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint recurring_booking_services_unique unique (salon_id, recurring_booking_id, service_id)
);

create table public.waiting_list (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null,
  operator_id uuid,
  requested_date date not null,
  requested_start_after time,
  requested_end_before time,
  notes text,
  status public.waiting_list_status not null default 'active',
  notified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint waiting_list_time_preference check (
    requested_start_after is null
    or requested_end_before is null
    or requested_end_before > requested_start_after
  )
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null,
  operator_id uuid not null,
  recurring_booking_id uuid,
  coupon_id uuid,
  status public.appointment_status not null default 'pending',
  scheduled_date date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  buffer_minutes integer not null default 5,
  total_duration_minutes integer not null,
  total_price_cents integer not null default 0,
  notes text,
  booked_by_role public.app_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  slot_range tstzrange not null,
  constraint appointments_window check (end_at > start_at),
  constraint appointments_duration_positive check (total_duration_minutes > 0),
  constraint appointments_buffer_non_negative check (buffer_minutes >= 0),
  constraint appointments_price_non_negative check (total_price_cents >= 0),
  constraint appointments_booked_by_role check (booked_by_role in ('salon_owner', 'customer'))
);

create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  appointment_id uuid not null,
  service_id uuid not null,
  service_name_snapshot text not null,
  price_cents_snapshot integer not null,
  duration_minutes_snapshot integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint appointment_services_price_non_negative check (price_cents_snapshot >= 0),
  constraint appointment_services_duration_positive check (duration_minutes_snapshot > 0),
  constraint appointment_services_unique unique (salon_id, appointment_id, sort_order)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null,
  appointment_id uuid unique,
  rating integer not null,
  title text,
  body text,
  is_published boolean not null default true,
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reviews_rating_range check (rating between 1 and 5)
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid,
  appointment_id uuid,
  channel public.notification_channel not null,
  event_key text not null,
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'queued',
  provider_name text,
  sent_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references public.salons(id) on delete cascade,
  actor_auth_user_id uuid,
  actor_role public.audit_actor_type not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.access_logs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references public.salons(id) on delete cascade,
  actor_auth_user_id uuid,
  actor_role public.audit_actor_type,
  access_channel public.access_channel not null,
  email text,
  success boolean not null,
  failure_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  requested_by_auth_user_id uuid not null,
  requested_by_role public.audit_actor_type not null,
  export_type text not null,
  file_format public.export_file_format not null,
  status public.export_job_status not null default 'queued',
  filters jsonb not null default '{}'::jsonb,
  file_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table public.build_jobs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  requested_by_auth_user_id uuid not null,
  requested_by_role public.audit_actor_type not null,
  target public.build_target not null,
  environment_mode public.environment_mode not null,
  status public.build_job_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table public.file_assets (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  bucket_name text not null,
  asset_path text not null,
  asset_kind public.asset_kind not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by_auth_user_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint file_assets_size_non_negative check (size_bytes is null or size_bytes >= 0),
  constraint file_assets_unique_path unique (salon_id, bucket_name, asset_path)
);

alter table public.salon_accounts
  add constraint salon_accounts_id_salon_unique unique (id, salon_id);

alter table public.service_categories
  add constraint service_categories_id_salon_unique unique (id, salon_id);

alter table public.services
  add constraint services_id_salon_unique unique (id, salon_id);

alter table public.operators
  add constraint operators_id_salon_unique unique (id, salon_id);

alter table public.portfolios
  add constraint portfolios_id_salon_unique unique (id, salon_id);

alter table public.promotions
  add constraint promotions_id_salon_unique unique (id, salon_id);

alter table public.coupons
  add constraint coupons_id_salon_unique unique (id, salon_id);

alter table public.customers
  add constraint customers_id_salon_unique unique (id, salon_id);

alter table public.recurring_bookings
  add constraint recurring_bookings_id_salon_unique unique (id, salon_id);

alter table public.appointments
  add constraint appointments_id_salon_unique unique (id, salon_id);

alter table public.salon_owners
  add constraint salon_owners_salon_account_same_salon_fkey
  foreign key (salon_account_id, salon_id) references public.salon_accounts(id, salon_id) on delete cascade;

alter table public.services
  add constraint services_category_same_salon_fkey
  foreign key (category_id, salon_id) references public.service_categories(id, salon_id) on delete set null;

alter table public.service_operator_assignments
  add constraint service_operator_assignments_service_same_salon_fkey
  foreign key (service_id, salon_id) references public.services(id, salon_id) on delete cascade;

alter table public.service_operator_assignments
  add constraint service_operator_assignments_operator_same_salon_fkey
  foreign key (operator_id, salon_id) references public.operators(id, salon_id) on delete cascade;

alter table public.business_hours
  add constraint business_hours_operator_same_salon_fkey
  foreign key (operator_id, salon_id) references public.operators(id, salon_id) on delete cascade;

alter table public.blocked_slots
  add constraint blocked_slots_operator_same_salon_fkey
  foreign key (operator_id, salon_id) references public.operators(id, salon_id) on delete set null;

alter table public.customers
  add constraint customers_salon_account_same_salon_fkey
  foreign key (salon_account_id, salon_id) references public.salon_accounts(id, salon_id) on delete set null;

alter table public.customers
  add constraint customers_preferred_operator_same_salon_fkey
  foreign key (preferred_operator_id, salon_id) references public.operators(id, salon_id) on delete set null;

alter table public.customer_profiles
  add constraint customer_profiles_customer_same_salon_fkey
  foreign key (customer_id, salon_id) references public.customers(id, salon_id) on delete cascade;

alter table public.consent_records
  add constraint consent_records_customer_same_salon_fkey
  foreign key (customer_id, salon_id) references public.customers(id, salon_id) on delete cascade;

alter table public.portfolio_images
  add constraint portfolio_images_portfolio_same_salon_fkey
  foreign key (portfolio_id, salon_id) references public.portfolios(id, salon_id) on delete cascade;

alter table public.promotion_services
  add constraint promotion_services_promotion_same_salon_fkey
  foreign key (promotion_id, salon_id) references public.promotions(id, salon_id) on delete cascade;

alter table public.promotion_services
  add constraint promotion_services_service_same_salon_fkey
  foreign key (service_id, salon_id) references public.services(id, salon_id) on delete cascade;

alter table public.coupons
  add constraint coupons_promotion_same_salon_fkey
  foreign key (promotion_id, salon_id) references public.promotions(id, salon_id) on delete set null;

alter table public.coupon_redemptions
  add constraint coupon_redemptions_coupon_same_salon_fkey
  foreign key (coupon_id, salon_id) references public.coupons(id, salon_id) on delete cascade;

alter table public.coupon_redemptions
  add constraint coupon_redemptions_customer_same_salon_fkey
  foreign key (customer_id, salon_id) references public.customers(id, salon_id) on delete cascade;

alter table public.coupon_redemptions
  add constraint coupon_redemptions_appointment_same_salon_fkey
  foreign key (appointment_id, salon_id) references public.appointments(id, salon_id) on delete set null;

alter table public.recurring_bookings
  add constraint recurring_bookings_customer_same_salon_fkey
  foreign key (customer_id, salon_id) references public.customers(id, salon_id) on delete cascade;

alter table public.recurring_bookings
  add constraint recurring_bookings_operator_same_salon_fkey
  foreign key (operator_id, salon_id) references public.operators(id, salon_id) on delete set null;

alter table public.recurring_booking_services
  add constraint recurring_booking_services_recurring_same_salon_fkey
  foreign key (recurring_booking_id, salon_id) references public.recurring_bookings(id, salon_id) on delete cascade;

alter table public.recurring_booking_services
  add constraint recurring_booking_services_service_same_salon_fkey
  foreign key (service_id, salon_id) references public.services(id, salon_id) on delete restrict;

alter table public.waiting_list
  add constraint waiting_list_customer_same_salon_fkey
  foreign key (customer_id, salon_id) references public.customers(id, salon_id) on delete cascade;

alter table public.waiting_list
  add constraint waiting_list_operator_same_salon_fkey
  foreign key (operator_id, salon_id) references public.operators(id, salon_id) on delete set null;

alter table public.appointments
  add constraint appointments_customer_same_salon_fkey
  foreign key (customer_id, salon_id) references public.customers(id, salon_id) on delete restrict;

alter table public.appointments
  add constraint appointments_operator_same_salon_fkey
  foreign key (operator_id, salon_id) references public.operators(id, salon_id) on delete restrict;

alter table public.appointments
  add constraint appointments_recurring_same_salon_fkey
  foreign key (recurring_booking_id, salon_id) references public.recurring_bookings(id, salon_id) on delete set null;

alter table public.appointments
  add constraint appointments_coupon_same_salon_fkey
  foreign key (coupon_id, salon_id) references public.coupons(id, salon_id) on delete set null;

alter table public.appointment_services
  add constraint appointment_services_appointment_same_salon_fkey
  foreign key (appointment_id, salon_id) references public.appointments(id, salon_id) on delete cascade;

alter table public.appointment_services
  add constraint appointment_services_service_same_salon_fkey
  foreign key (service_id, salon_id) references public.services(id, salon_id) on delete restrict;

alter table public.reviews
  add constraint reviews_customer_same_salon_fkey
  foreign key (customer_id, salon_id) references public.customers(id, salon_id) on delete cascade;

alter table public.reviews
  add constraint reviews_appointment_same_salon_fkey
  foreign key (appointment_id, salon_id) references public.appointments(id, salon_id) on delete set null;

alter table public.notification_logs
  add constraint notification_logs_customer_same_salon_fkey
  foreign key (customer_id, salon_id) references public.customers(id, salon_id) on delete set null;

alter table public.notification_logs
  add constraint notification_logs_appointment_same_salon_fkey
  foreign key (appointment_id, salon_id) references public.appointments(id, salon_id) on delete set null;

create index salons_name_idx on public.salons (name);
create index salon_accounts_auth_idx on public.salon_accounts (auth_user_id, salon_id);
create index salon_accounts_role_idx on public.salon_accounts (salon_id, role);
create index salon_subscriptions_salon_status_idx on public.salon_subscriptions (salon_id, status);
create index salon_status_history_salon_created_idx on public.salon_status_history (salon_id, created_at desc);
create index salon_feature_flags_salon_idx on public.salon_feature_flags (salon_id);
create index salon_owners_salon_idx on public.salon_owners (salon_id);
create index operators_salon_active_idx on public.operators (salon_id, is_active);
create index services_salon_active_idx on public.services (salon_id, is_active);
create index services_category_idx on public.services (category_id);
create index service_operator_assignments_service_idx on public.service_operator_assignments (service_id, operator_id);
create index business_hours_salon_day_idx on public.business_hours (salon_id, day_of_week);
create unique index business_hours_unique_salon_day_idx on public.business_hours (salon_id, day_of_week) where operator_id is null;
create unique index business_hours_unique_operator_day_idx on public.business_hours (salon_id, operator_id, day_of_week) where operator_id is not null;
create index blocked_slots_salon_operator_idx on public.blocked_slots (salon_id, operator_id, starts_at);
create index customers_salon_email_idx on public.customers (salon_id, email);
create index customers_auth_idx on public.customers (auth_user_id, salon_id);
create index consent_records_customer_idx on public.consent_records (customer_id, consent_type, captured_at desc);
create index portfolios_salon_published_idx on public.portfolios (salon_id, is_published);
create index portfolio_images_portfolio_idx on public.portfolio_images (portfolio_id, sort_order);
create index promotions_salon_active_window_idx on public.promotions (salon_id, is_active, starts_at, ends_at);
create index coupons_salon_active_window_idx on public.coupons (salon_id, is_active, starts_at, ends_at);
create index coupon_redemptions_coupon_customer_idx on public.coupon_redemptions (coupon_id, customer_id);
create index recurring_bookings_salon_status_idx on public.recurring_bookings (salon_id, status);
create index waiting_list_salon_status_idx on public.waiting_list (salon_id, status, requested_date);
create index appointments_salon_date_idx on public.appointments (salon_id, scheduled_date);
create index appointments_customer_idx on public.appointments (customer_id, start_at desc);
create index appointments_operator_idx on public.appointments (operator_id, start_at);
create index appointment_services_appointment_idx on public.appointment_services (appointment_id, sort_order);
create index reviews_salon_published_idx on public.reviews (salon_id, is_published, published_at desc);
create index notification_logs_salon_status_idx on public.notification_logs (salon_id, status, created_at desc);
create index audit_logs_salon_created_idx on public.audit_logs (salon_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_auth_user_id, created_at desc);
create index access_logs_salon_created_idx on public.access_logs (salon_id, created_at desc);
create index export_jobs_salon_status_idx on public.export_jobs (salon_id, status, created_at desc);
create index build_jobs_salon_status_idx on public.build_jobs (salon_id, status, created_at desc);
create index file_assets_salon_kind_idx on public.file_assets (salon_id, asset_kind);
create unique index salon_owners_one_primary_idx on public.salon_owners (salon_id) where is_primary = true;

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    salon_id with =,
    operator_id with =,
    slot_range with &&
  )
  where (status in ('pending', 'confirmed'));

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.super_admins sa
    where sa.auth_user_id = auth.uid()
      and sa.is_active = true
  );
$$;

create or replace function public.current_salon_role(p_salon_id uuid)
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select sa.role
  from public.salon_accounts sa
  where sa.salon_id = p_salon_id
    and sa.auth_user_id = auth.uid()
    and sa.is_enabled = true
  limit 1;
$$;

create or replace function public.is_salon_member(p_salon_id uuid, p_roles public.app_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.salon_accounts sa
    where sa.salon_id = p_salon_id
      and sa.auth_user_id = auth.uid()
      and sa.is_enabled = true
      and (p_roles is null or sa.role = any(p_roles))
  );
$$;

create or replace function public.is_salon_active(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.salons s
    where s.id = p_salon_id
      and s.status = 'active'
  );
$$;

create or replace function public.can_access_tenant_config(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or public.is_salon_member(p_salon_id, array['salon_owner'::public.app_role, 'customer'::public.app_role]);
$$;

create or replace function public.can_access_tenant_ops(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or (
      public.is_salon_active(p_salon_id)
      and public.is_salon_member(p_salon_id, array['salon_owner'::public.app_role, 'customer'::public.app_role])
    );
$$;

create or replace function public.can_manage_salon(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or (
      public.is_salon_active(p_salon_id)
      and public.is_salon_member(p_salon_id, array['salon_owner'::public.app_role])
    );
$$;

create or replace function public.current_customer_id(p_salon_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.customers c
  where c.salon_id = p_salon_id
    and c.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.belongs_to_current_customer(p_salon_id uuid, p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_customer_id(p_salon_id) = p_customer_id;
$$;

create or replace function public.can_self_register_customer(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and public.is_salon_active(p_salon_id);
$$;

create trigger set_updated_at_super_admins
before update on public.super_admins
for each row execute function public.set_updated_at();

create trigger set_updated_at_salons
before update on public.salons
for each row execute function public.set_updated_at();

create trigger set_salons_demo_enabled_before_write
before insert or update of environment_mode on public.salons
for each row execute function public.set_salons_demo_enabled();

create trigger sync_demo_mode_from_salons
after update of environment_mode on public.salons
for each row execute function public.sync_salon_demo_mode();

create trigger set_updated_at_salon_accounts
before update on public.salon_accounts
for each row execute function public.set_updated_at();

create trigger set_updated_at_salon_subscriptions
before update on public.salon_subscriptions
for each row execute function public.set_updated_at();

create trigger set_updated_at_salon_branding
before update on public.salon_branding
for each row execute function public.set_updated_at();

create trigger set_updated_at_salon_app_configs
before update on public.salon_app_configs
for each row execute function public.set_updated_at();

create trigger set_updated_at_salon_demo_configs
before update on public.salon_demo_configs
for each row execute function public.set_updated_at();

create trigger sync_demo_mode_from_demo_configs
after insert or update of environment_mode on public.salon_demo_configs
for each row execute function public.sync_salon_demo_mode();

create trigger set_updated_at_salon_feature_flags
before update on public.salon_feature_flags
for each row execute function public.set_updated_at();

create trigger set_updated_at_salon_owners
before update on public.salon_owners
for each row execute function public.set_updated_at();

create trigger set_updated_at_operators
before update on public.operators
for each row execute function public.set_updated_at();

create trigger set_updated_at_service_categories
before update on public.service_categories
for each row execute function public.set_updated_at();

create trigger set_updated_at_services
before update on public.services
for each row execute function public.set_updated_at();

create trigger set_updated_at_business_hours
before update on public.business_hours
for each row execute function public.set_updated_at();

create trigger set_updated_at_blocked_slots
before update on public.blocked_slots
for each row execute function public.set_updated_at();

create trigger set_updated_at_customers
before update on public.customers
for each row execute function public.set_updated_at();

create trigger set_updated_at_customer_profiles
before update on public.customer_profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_portfolios
before update on public.portfolios
for each row execute function public.set_updated_at();

create trigger set_updated_at_portfolio_images
before update on public.portfolio_images
for each row execute function public.set_updated_at();

create trigger set_updated_at_promotions
before update on public.promotions
for each row execute function public.set_updated_at();

create trigger set_updated_at_coupons
before update on public.coupons
for each row execute function public.set_updated_at();

create trigger set_updated_at_recurring_bookings
before update on public.recurring_bookings
for each row execute function public.set_updated_at();

create trigger set_updated_at_waiting_list
before update on public.waiting_list
for each row execute function public.set_updated_at();

create trigger set_updated_at_appointments
before update on public.appointments
for each row execute function public.set_updated_at();

create trigger set_appointment_slot_range_before_write
before insert or update of start_at, end_at, buffer_minutes on public.appointments
for each row execute function public.set_appointment_slot_range();

create trigger set_updated_at_reviews
before update on public.reviews
for each row execute function public.set_updated_at();

create trigger set_updated_at_export_jobs
before update on public.export_jobs
for each row execute function public.set_updated_at();

create trigger set_updated_at_build_jobs
before update on public.build_jobs
for each row execute function public.set_updated_at();

create trigger set_updated_at_file_assets
before update on public.file_assets
for each row execute function public.set_updated_at();
