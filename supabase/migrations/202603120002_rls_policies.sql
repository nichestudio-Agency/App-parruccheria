alter table public.super_admins enable row level security;
alter table public.salons enable row level security;
alter table public.salon_accounts enable row level security;
alter table public.salon_subscriptions enable row level security;
alter table public.salon_status_history enable row level security;
alter table public.salon_branding enable row level security;
alter table public.salon_app_configs enable row level security;
alter table public.salon_demo_configs enable row level security;
alter table public.salon_feature_flags enable row level security;
alter table public.salon_owners enable row level security;
alter table public.operators enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.service_operator_assignments enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.customers enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.consent_records enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_services enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.recurring_bookings enable row level security;
alter table public.recurring_booking_services enable row level security;
alter table public.waiting_list enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.reviews enable row level security;
alter table public.notification_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.access_logs enable row level security;
alter table public.export_jobs enable row level security;
alter table public.build_jobs enable row level security;
alter table public.file_assets enable row level security;

create policy "super_admins_self_or_admin_select"
on public.super_admins
for select
using (auth.uid() = auth_user_id or public.is_super_admin());

create policy "super_admins_self_or_admin_update"
on public.super_admins
for update
using (auth.uid() = auth_user_id or public.is_super_admin())
with check (auth.uid() = auth_user_id or public.is_super_admin());

create policy "salons_super_admin_manage"
on public.salons
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "salons_members_select_own"
on public.salons
for select
using (public.can_access_tenant_config(id));

create policy "salon_accounts_super_admin_manage"
on public.salon_accounts
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "salon_accounts_owner_select_owner_rows"
on public.salon_accounts
for select
using (
  public.can_manage_salon(salon_id)
  and role = 'salon_owner'
);

create policy "salon_accounts_self_select"
on public.salon_accounts
for select
using (auth.uid() = auth_user_id);

create policy "salon_accounts_self_update"
on public.salon_accounts
for update
using (false)
with check (false);

create policy "salon_accounts_customer_self_insert"
on public.salon_accounts
for insert
with check (
  public.can_self_register_customer(salon_id)
  and auth.uid() = auth_user_id
  and role = 'customer'
  and is_primary_owner = false
  and is_enabled = true
);

create policy "salon_subscriptions_super_admin_only"
on public.salon_subscriptions
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "salon_status_history_super_admin_select_insert"
on public.salon_status_history
for select
using (public.is_super_admin());

create policy "salon_status_history_super_admin_insert"
on public.salon_status_history
for insert
with check (public.is_super_admin());

create policy "salon_branding_super_admin_manage"
on public.salon_branding
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "salon_branding_members_select"
on public.salon_branding
for select
using (public.can_access_tenant_config(salon_id));

create policy "salon_app_configs_super_admin_manage"
on public.salon_app_configs
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "salon_app_configs_members_select"
on public.salon_app_configs
for select
using (public.can_access_tenant_config(salon_id));

create policy "salon_demo_configs_super_admin_manage"
on public.salon_demo_configs
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "salon_demo_configs_members_select"
on public.salon_demo_configs
for select
using (public.can_access_tenant_config(salon_id));

create policy "salon_feature_flags_super_admin_manage"
on public.salon_feature_flags
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "salon_feature_flags_members_select"
on public.salon_feature_flags
for select
using (public.can_access_tenant_config(salon_id));

create policy "salon_owners_super_admin_manage"
on public.salon_owners
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "salon_owners_owner_select"
on public.salon_owners
for select
using (public.can_manage_salon(salon_id));

create policy "operators_super_admin_manage"
on public.operators
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "operators_owner_manage"
on public.operators
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "operators_customer_select_active"
on public.operators
for select
using (public.can_access_tenant_ops(salon_id));

create policy "service_categories_super_admin_manage"
on public.service_categories
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "service_categories_owner_manage"
on public.service_categories
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "service_categories_customer_select"
on public.service_categories
for select
using (public.can_access_tenant_ops(salon_id));

create policy "services_super_admin_manage"
on public.services
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "services_owner_manage"
on public.services
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "services_customer_select"
on public.services
for select
using (public.can_access_tenant_ops(salon_id));

create policy "service_operator_assignments_super_admin_manage"
on public.service_operator_assignments
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "service_operator_assignments_owner_manage"
on public.service_operator_assignments
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "service_operator_assignments_customer_select"
on public.service_operator_assignments
for select
using (public.can_access_tenant_ops(salon_id));

create policy "business_hours_super_admin_manage"
on public.business_hours
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "business_hours_owner_manage"
on public.business_hours
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "business_hours_customer_select"
on public.business_hours
for select
using (public.can_access_tenant_ops(salon_id));

create policy "blocked_slots_super_admin_manage"
on public.blocked_slots
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "blocked_slots_owner_manage"
on public.blocked_slots
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "blocked_slots_customer_select"
on public.blocked_slots
for select
using (public.can_access_tenant_ops(salon_id));

create policy "customers_super_admin_manage"
on public.customers
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "customers_owner_manage"
on public.customers
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "customers_self_select"
on public.customers
for select
using (
  public.can_access_tenant_ops(salon_id)
  and auth.uid() = auth_user_id
);

create policy "customers_self_update"
on public.customers
for update
using (
  public.can_access_tenant_ops(salon_id)
  and auth.uid() = auth_user_id
)
with check (
  public.can_access_tenant_ops(salon_id)
  and auth.uid() = auth_user_id
);

create policy "customers_self_insert"
on public.customers
for insert
with check (
  public.can_self_register_customer(salon_id)
  and auth.uid() = auth_user_id
  and exists (
    select 1
    from public.salon_accounts sa
    where sa.id = salon_account_id
      and sa.salon_id = customers.salon_id
      and sa.auth_user_id = auth.uid()
      and sa.role = 'customer'
      and sa.is_enabled = true
  )
);

create policy "customer_profiles_super_admin_manage"
on public.customer_profiles
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "customer_profiles_owner_manage"
on public.customer_profiles
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "customer_profiles_customer_select"
on public.customer_profiles
for select
using (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "customer_profiles_customer_update"
on public.customer_profiles
for update
using (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
)
with check (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "customer_profiles_customer_insert"
on public.customer_profiles
for insert
with check (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "consent_records_super_admin_manage"
on public.consent_records
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "consent_records_owner_select"
on public.consent_records
for select
using (public.can_manage_salon(salon_id));

create policy "consent_records_customer_select_insert"
on public.consent_records
for select
using (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "consent_records_customer_insert"
on public.consent_records
for insert
with check (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "portfolios_super_admin_manage"
on public.portfolios
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "portfolios_owner_manage"
on public.portfolios
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "portfolios_customer_select"
on public.portfolios
for select
using (public.can_access_tenant_ops(salon_id));

create policy "portfolio_images_super_admin_manage"
on public.portfolio_images
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "portfolio_images_owner_manage"
on public.portfolio_images
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "portfolio_images_customer_select"
on public.portfolio_images
for select
using (public.can_access_tenant_ops(salon_id));

create policy "promotions_super_admin_manage"
on public.promotions
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "promotions_owner_manage"
on public.promotions
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "promotions_customer_select"
on public.promotions
for select
using (public.can_access_tenant_ops(salon_id));

create policy "promotion_services_super_admin_manage"
on public.promotion_services
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "promotion_services_owner_manage"
on public.promotion_services
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "promotion_services_customer_select"
on public.promotion_services
for select
using (public.can_access_tenant_ops(salon_id));

create policy "coupons_super_admin_manage"
on public.coupons
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "coupons_owner_manage"
on public.coupons
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "coupons_customer_select"
on public.coupons
for select
using (public.can_access_tenant_ops(salon_id));

create policy "coupon_redemptions_super_admin_manage"
on public.coupon_redemptions
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "coupon_redemptions_owner_select"
on public.coupon_redemptions
for select
using (public.can_manage_salon(salon_id));

create policy "coupon_redemptions_customer_select_insert"
on public.coupon_redemptions
for select
using (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "coupon_redemptions_customer_insert"
on public.coupon_redemptions
for insert
with check (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "recurring_bookings_super_admin_manage"
on public.recurring_bookings
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "recurring_bookings_owner_manage"
on public.recurring_bookings
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "recurring_bookings_customer_manage_own"
on public.recurring_bookings
for all
using (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
)
with check (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "recurring_booking_services_super_admin_manage"
on public.recurring_booking_services
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "recurring_booking_services_owner_manage"
on public.recurring_booking_services
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "recurring_booking_services_customer_select"
on public.recurring_booking_services
for select
using (
  public.can_access_tenant_ops(salon_id)
  and exists (
    select 1
    from public.recurring_bookings rb
    where rb.id = recurring_booking_id
      and public.belongs_to_current_customer(salon_id, rb.customer_id)
  )
);

create policy "waiting_list_super_admin_manage"
on public.waiting_list
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "waiting_list_owner_manage"
on public.waiting_list
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "waiting_list_customer_manage_own"
on public.waiting_list
for all
using (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
)
with check (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "appointments_super_admin_manage"
on public.appointments
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "appointments_owner_manage"
on public.appointments
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "appointments_customer_manage_own"
on public.appointments
for all
using (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
)
with check (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "appointment_services_super_admin_manage"
on public.appointment_services
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "appointment_services_owner_manage"
on public.appointment_services
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "appointment_services_customer_select"
on public.appointment_services
for select
using (
  public.can_access_tenant_ops(salon_id)
  and exists (
    select 1
    from public.appointments a
    where a.id = appointment_id
      and public.belongs_to_current_customer(salon_id, a.customer_id)
  )
);

create policy "reviews_super_admin_manage"
on public.reviews
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "reviews_owner_select"
on public.reviews
for select
using (public.can_manage_salon(salon_id));

create policy "reviews_customer_select"
on public.reviews
for select
using (public.can_access_tenant_ops(salon_id));

create policy "reviews_customer_insert_update_own"
on public.reviews
for all
using (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
)
with check (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "notification_logs_super_admin_manage"
on public.notification_logs
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "notification_logs_owner_select"
on public.notification_logs
for select
using (public.can_manage_salon(salon_id));

create policy "notification_logs_customer_select_own"
on public.notification_logs
for select
using (
  public.can_access_tenant_ops(salon_id)
  and public.belongs_to_current_customer(salon_id, customer_id)
);

create policy "audit_logs_super_admin_manage"
on public.audit_logs
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "audit_logs_owner_select"
on public.audit_logs
for select
using (
  salon_id is not null
  and public.can_manage_salon(salon_id)
);

create policy "access_logs_super_admin_manage"
on public.access_logs
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "access_logs_owner_select"
on public.access_logs
for select
using (
  salon_id is not null
  and public.can_manage_salon(salon_id)
);

create policy "export_jobs_super_admin_manage"
on public.export_jobs
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "export_jobs_owner_manage"
on public.export_jobs
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "build_jobs_super_admin_manage"
on public.build_jobs
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "file_assets_super_admin_manage"
on public.file_assets
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "file_assets_owner_manage"
on public.file_assets
for all
using (public.can_manage_salon(salon_id))
with check (public.can_manage_salon(salon_id));

create policy "file_assets_customer_select"
on public.file_assets
for select
using (public.can_access_tenant_ops(salon_id));
