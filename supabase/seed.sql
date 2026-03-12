insert into public.super_admins (id, auth_user_id, email, full_name)
values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'admin@platforma.it', 'Fabio Pace');

insert into public.salons (
  id,
  tenant_key,
  name,
  commercial_name,
  legal_name,
  status,
  environment_mode,
  demo_enabled,
  billing_email,
  phone,
  vat_number,
  address_line_1,
  city,
  province,
  postal_code
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    'barberia-rossi',
    'Barberia Rossi',
    'Barberia Rossi',
    'Barberia Rossi SRL',
    'active',
    'production',
    false,
    'amministrazione@barberiarossi.it',
    '+39 02 1234567',
    'IT12345678901',
    'Via Torino 18',
    'Milano',
    'MI',
    '20123'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'atelier-uomo-firenze',
    'Atelier Uomo Firenze',
    'Atelier Uomo',
    'Atelier Uomo SNC',
    'active',
    'demo',
    true,
    'info@atelieruomo.it',
    '+39 055 555123',
    'IT22345678901',
    'Via dei Servi 41',
    'Firenze',
    'FI',
    '50122'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'salone-verdi-roma',
    'Salone Verdi Roma',
    'Salone Verdi',
    'Salone Verdi SAS',
    'suspended',
    'production',
    false,
    'contabilita@saloneverdi.it',
    '+39 06 9876543',
    'IT32345678901',
    'Via Appia 95',
    'Roma',
    'RM',
    '00183'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    'barber-club-napoli',
    'Barber Club Napoli',
    'Barber Club',
    'Barber Club SRLS',
    'expired',
    'production',
    false,
    'admin@barberclubnapoli.it',
    '+39 081 112233',
    'IT42345678901',
    'Via Chiaia 72',
    'Napoli',
    'NA',
    '80121'
  );

insert into public.salon_status_history (
  id,
  salon_id,
  previous_status,
  new_status,
  changed_by_auth_user_id,
  changed_by_role,
  reason
)
values
  (
    '31000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    null,
    'active',
    '20000000-0000-0000-0000-000000000001',
    'super_admin',
    'Attivazione iniziale tenant'
  ),
  (
    '31000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    null,
    'active',
    '20000000-0000-0000-0000-000000000001',
    'super_admin',
    'Creazione demo commerciale'
  ),
  (
    '31000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    'active',
    'suspended',
    '20000000-0000-0000-0000-000000000001',
    'super_admin',
    'Canone non saldato'
  ),
  (
    '31000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    'active',
    'expired',
    '20000000-0000-0000-0000-000000000001',
    'super_admin',
    'Contratto scaduto'
  );

insert into public.salon_subscriptions (
  id,
  salon_id,
  status,
  billing_cycle,
  monthly_fee_cents,
  starts_at,
  ends_at,
  trial_ends_at,
  next_billing_at,
  notes
)
values
  (
    '32000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'active',
    'monthly',
    9900,
    '2026-01-01T00:00:00Z',
    null,
    null,
    '2026-04-01T00:00:00Z',
    'Primo cliente reale'
  ),
  (
    '32000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'trial',
    'monthly',
    0,
    '2026-03-01T00:00:00Z',
    null,
    '2026-03-31T23:59:59Z',
    null,
    'Demo di prevendita'
  ),
  (
    '32000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    'suspended',
    'monthly',
    9900,
    '2025-11-01T00:00:00Z',
    null,
    null,
    '2026-03-05T00:00:00Z',
    'Tenant sospeso per mancato pagamento'
  ),
  (
    '32000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    'expired',
    'annual',
    8900,
    '2025-01-01T00:00:00Z',
    '2026-01-01T00:00:00Z',
    null,
    null,
    'Contratto annuale concluso'
  );

insert into public.salon_branding (
  id,
  salon_id,
  app_display_name,
  salon_display_name,
  primary_color,
  secondary_color,
  accent_color,
  logo_asset_path,
  app_icon_asset_path,
  splash_asset_path,
  theme_json
)
values
  (
    '33000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Barberia Rossi',
    'Barberia Rossi',
    '#111111',
    '#D4AF37',
    '#F5F1E8',
    'branding/barberia-rossi/logo.png',
    'branding/barberia-rossi/icon.png',
    'branding/barberia-rossi/splash.png',
    '{"font":"Manrope","surface":"cream"}'
  ),
  (
    '33000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'Atelier Uomo',
    'Atelier Uomo',
    '#1E293B',
    '#C084FC',
    '#F8FAFC',
    'branding/atelier-uomo/logo.png',
    'branding/atelier-uomo/icon.png',
    'branding/atelier-uomo/splash.png',
    '{"font":"Cormorant","surface":"light"}'
  ),
  (
    '33000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    'Salone Verdi',
    'Salone Verdi',
    '#123524',
    '#F4CE14',
    '#F5F7F8',
    'branding/salone-verdi/logo.png',
    'branding/salone-verdi/icon.png',
    'branding/salone-verdi/splash.png',
    '{"font":"Lora","surface":"sage"}'
  ),
  (
    '33000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    'Barber Club',
    'Barber Club',
    '#0F172A',
    '#F97316',
    '#FFF7ED',
    'branding/barber-club/logo.png',
    'branding/barber-club/icon.png',
    'branding/barber-club/splash.png',
    '{"font":"Sora","surface":"sand"}'
  );

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
  release_channel,
  extra
)
values
  (
    '34000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'barberia-rossi',
    'Barberia Rossi',
    'barberia-rossi',
    'it.tuodominio.barberiarossi',
    'it.tuodominio.barberiarossi',
    'barberiarossi',
    'production',
    'production',
    '{"tenantKey":"barberia-rossi","storeLocale":"it-IT"}'
  ),
  (
    '34000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'atelier-uomo-firenze',
    'Atelier Uomo',
    'atelier-uomo',
    'it.tuodominio.atelieruomo',
    'it.tuodominio.atelieruomo',
    'atelieruomo',
    'preview',
    'preview',
    '{"tenantKey":"atelier-uomo-firenze","storeLocale":"it-IT"}'
  ),
  (
    '34000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    'salone-verdi-roma',
    'Salone Verdi',
    'salone-verdi',
    'it.tuodominio.saloneverdi',
    'it.tuodominio.saloneverdi',
    'saloneverdi',
    'production',
    'production',
    '{"tenantKey":"salone-verdi-roma","storeLocale":"it-IT"}'
  ),
  (
    '34000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    'barber-club-napoli',
    'Barber Club',
    'barber-club',
    'it.tuodominio.barberclub',
    'it.tuodominio.barberclub',
    'barberclub',
    'production',
    'production',
    '{"tenantKey":"barber-club-napoli","storeLocale":"it-IT"}'
  );

insert into public.salon_demo_configs (
  id,
  salon_id,
  environment_mode,
  demo_expires_at,
  demo_banner_text,
  booking_enabled,
  notifications_suppressed,
  seed_template,
  notes
)
values
  (
    '35000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'production',
    null,
    null,
    true,
    false,
    'none',
    'Tenant produttivo'
  ),
  (
    '35000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'demo',
    '2026-03-31T23:59:59Z',
    'Versione demo riservata al salone',
    true,
    true,
    'default_demo',
    'Demo con dati dimostrativi'
  ),
  (
    '35000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    'production',
    null,
    null,
    true,
    false,
    'none',
    'Tenant sospeso'
  ),
  (
    '35000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    'production',
    null,
    null,
    true,
    false,
    'none',
    'Tenant scaduto'
  );

insert into public.salon_feature_flags (id, salon_id, flag_key, is_enabled, config)
values
  ('36000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'waiting_list', true, '{}'),
  ('36000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'recurring_bookings', true, '{}'),
  ('36000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'waiting_list', true, '{}'),
  ('36000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'recurring_bookings', false, '{}');

insert into public.salon_accounts (
  id,
  salon_id,
  auth_user_id,
  role,
  email,
  first_name,
  last_name,
  phone,
  is_primary_owner
)
values
  (
    '37000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000101',
    'salon_owner',
    'marco@barberiarossi.it',
    'Marco',
    'Rossi',
    '+39 347 1111111',
    true
  ),
  (
    '37000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000102',
    'salon_owner',
    'giulia@atelieruomo.it',
    'Giulia',
    'Bianchi',
    '+39 348 2222222',
    true
  ),
  (
    '37000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000103',
    'salon_owner',
    'luca@saloneverdi.it',
    'Luca',
    'Verdi',
    '+39 349 3333333',
    true
  ),
  (
    '37000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000201',
    'customer',
    'anna.ferrari@example.com',
    'Anna',
    'Ferrari',
    '+39 320 1112233',
    false
  ),
  (
    '37000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000202',
    'customer',
    'davide.moretti@example.com',
    'Davide',
    'Moretti',
    '+39 320 4445566',
    false
  ),
  (
    '37000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000203',
    'customer',
    'serena.neri@example.com',
    'Serena',
    'Neri',
    '+39 320 7778899',
    false
  );

insert into public.salon_owners (
  id,
  salon_id,
  salon_account_id,
  first_name,
  last_name,
  email,
  phone,
  is_primary
)
values
  (
    '38000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000001',
    'Marco',
    'Rossi',
    'marco@barberiarossi.it',
    '+39 347 1111111',
    true
  ),
  (
    '38000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    '37000000-0000-0000-0000-000000000002',
    'Giulia',
    'Bianchi',
    'giulia@atelieruomo.it',
    '+39 348 2222222',
    true
  ),
  (
    '38000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    '37000000-0000-0000-0000-000000000003',
    'Luca',
    'Verdi',
    'luca@saloneverdi.it',
    '+39 349 3333333',
    true
  );

insert into public.operators (id, salon_id, display_name, bio, color_hex, sort_order, is_active)
values
  ('39000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Marco Rossi', 'Specialista taglio uomo e barba classica.', '#1F2937', 1, true),
  ('39000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Elia Conti', 'Skin fade e grooming moderno.', '#B45309', 2, true),
  ('39000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Giulia Bianchi', 'Consulenza immagine e taglio premium.', '#7C3AED', 1, true);

insert into public.service_categories (id, salon_id, name, description, sort_order, is_active)
values
  ('3A000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Taglio', 'Servizi di taglio capelli.', 1, true),
  ('3A000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Barba', 'Regolazione e rasatura barba.', 2, true),
  ('3A000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Styling', 'Servizi premium demo.', 1, true);

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
)
values
  ('3B000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '3A000000-0000-0000-0000-000000000001', 'Taglio Uomo', 'Taglio completo con consulenza rapida.', 30, 2500, 5, true),
  ('3B000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '3A000000-0000-0000-0000-000000000002', 'Barba Premium', 'Barba con panni caldi e rifinitura.', 20, 1800, 5, true),
  ('3B000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '3A000000-0000-0000-0000-000000000001', 'Taglio + Styling', 'Taglio e finish styling.', 45, 3200, 5, true),
  ('3B000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', '3A000000-0000-0000-0000-000000000003', 'Taglio Demo', 'Servizio dimostrativo.', 40, 3000, 5, true);

insert into public.service_operator_assignments (id, salon_id, service_id, operator_id)
values
  ('3C000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '3B000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000001'),
  ('3C000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '3B000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000002'),
  ('3C000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '3B000000-0000-0000-0000-000000000002', '39000000-0000-0000-0000-000000000001'),
  ('3C000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '3B000000-0000-0000-0000-000000000003', '39000000-0000-0000-0000-000000000002'),
  ('3C000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '3B000000-0000-0000-0000-000000000004', '39000000-0000-0000-0000-000000000003');

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
)
values
  ('3D000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', null, 1, '09:00', '19:00', '13:00', '14:00', false),
  ('3D000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', null, 2, '09:00', '19:00', '13:00', '14:00', false),
  ('3D000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', null, 3, '09:00', '19:00', '13:00', '14:00', false),
  ('3D000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', null, 4, '09:00', '19:00', '13:00', '14:00', false),
  ('3D000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', null, 5, '09:00', '19:00', '13:00', '14:00', false),
  ('3D000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', null, 6, '09:00', '17:00', null, null, false),
  ('3D000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000002', null, 2, '10:00', '18:00', '13:00', '14:00', false);

insert into public.blocked_slots (
  id,
  salon_id,
  operator_id,
  starts_at,
  ends_at,
  reason,
  created_by_auth_user_id
)
values
  (
    '3E000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '39000000-0000-0000-0000-000000000002',
    '2026-03-16T12:00:00Z',
    '2026-03-16T14:00:00Z',
    'Pausa formazione interna',
    '20000000-0000-0000-0000-000000000101'
  );

insert into public.customers (
  id,
  salon_id,
  salon_account_id,
  auth_user_id,
  first_name,
  last_name,
  email,
  phone,
  date_of_birth,
  notes,
  preferred_operator_id
)
values
  (
    '3F000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000201',
    'Anna',
    'Ferrari',
    'anna.ferrari@example.com',
    '+39 320 1112233',
    '1992-05-14',
    'Preferisce appuntamenti serali.',
    '39000000-0000-0000-0000-000000000001'
  ),
  (
    '3F000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000202',
    'Davide',
    'Moretti',
    'davide.moretti@example.com',
    '+39 320 4445566',
    '1988-11-02',
    'Pelle sensibile, evitare prodotti profumati.',
    '39000000-0000-0000-0000-000000000002'
  ),
  (
    '3F000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000002',
    '37000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000203',
    'Serena',
    'Neri',
    'serena.neri@example.com',
    '+39 320 7778899',
    '1995-08-21',
    'Cliente demo.',
    '39000000-0000-0000-0000-000000000003'
  );

insert into public.customer_profiles (
  id,
  salon_id,
  customer_id,
  preferences,
  internal_notes,
  last_visit_at,
  total_appointments,
  no_show_count
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '3F000000-0000-0000-0000-000000000001',
    '{"favoriteServices":["Taglio Uomo","Barba Premium"]}',
    'Cliente molto puntuale.',
    '2026-03-01T10:00:00Z',
    6,
    0
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '3F000000-0000-0000-0000-000000000002',
    '{"favoriteServices":["Taglio + Styling"]}',
    'Predilige operatori junior.',
    '2026-02-20T15:30:00Z',
    3,
    1
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000002',
    '3F000000-0000-0000-0000-000000000003',
    '{"favoriteServices":["Taglio Demo"]}',
    'Record demo.',
    null,
    0,
    0
  );

insert into public.consent_records (
  id,
  salon_id,
  customer_id,
  consent_type,
  granted,
  source,
  captured_at
)
values
  ('41000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '3F000000-0000-0000-0000-000000000001', 'privacy', true, 'mobile_signup', '2026-01-08T09:00:00Z'),
  ('41000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '3F000000-0000-0000-0000-000000000001', 'marketing', true, 'mobile_signup', '2026-01-08T09:00:00Z'),
  ('41000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '3F000000-0000-0000-0000-000000000002', 'privacy', true, 'owner_import', '2026-01-10T15:00:00Z'),
  ('41000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', '3F000000-0000-0000-0000-000000000003', 'privacy', true, 'demo_seed', '2026-03-02T11:00:00Z');

insert into public.portfolios (id, salon_id, title, description, is_published, sort_order)
values
  ('42000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Skin Fade', 'Lavoro premium con sfumatura alta.', true, 1),
  ('42000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Barba scolpita', 'Rifinitura classica con panni caldi.', true, 2),
  ('42000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Look Demo', 'Galleria dimostrativa.', true, 1);

insert into public.portfolio_images (id, salon_id, portfolio_id, asset_path, alt_text, is_cover, sort_order)
values
  ('43000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', 'portfolio/barberia-rossi/fade-1.jpg', 'Taglio skin fade', true, 1),
  ('43000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000002', 'portfolio/barberia-rossi/beard-1.jpg', 'Barba definita', true, 1),
  ('43000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '42000000-0000-0000-0000-000000000003', 'portfolio/atelier-uomo/demo-1.jpg', 'Look demo', true, 1);

insert into public.promotions (
  id,
  salon_id,
  title,
  description,
  discount_type,
  discount_value,
  starts_at,
  ends_at,
  is_active
)
values
  (
    '44000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Promo Primo Appuntamento',
    'Sconto sul primo taglio prenotato da app.',
    'percentage',
    15.00,
    '2026-03-01T00:00:00Z',
    '2026-03-31T23:59:59Z',
    true
  ),
  (
    '44000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'Demo Opening',
    'Promozione dimostrativa.',
    'fixed_amount',
    5.00,
    '2026-03-01T00:00:00Z',
    '2026-03-31T23:59:59Z',
    true
  );

insert into public.promotion_services (id, salon_id, promotion_id, service_id)
values
  ('45000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', '3B000000-0000-0000-0000-000000000001'),
  ('45000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '44000000-0000-0000-0000-000000000002', '3B000000-0000-0000-0000-000000000004');

insert into public.coupons (
  id,
  salon_id,
  promotion_id,
  code,
  title,
  description,
  discount_type,
  discount_value,
  usage_limit_total,
  usage_limit_per_customer,
  starts_at,
  ends_at,
  is_active
)
values
  (
    '46000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '44000000-0000-0000-0000-000000000001',
    'WELCOME15',
    'Benvenuto App',
    'Coupon di benvenuto.',
    'percentage',
    15.00,
    100,
    1,
    '2026-03-01T00:00:00Z',
    '2026-03-31T23:59:59Z',
    true
  ),
  (
    '46000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    '44000000-0000-0000-0000-000000000002',
    'DEMO5',
    'Demo Coupon',
    'Coupon dimostrativo.',
    'fixed_amount',
    5.00,
    50,
    1,
    '2026-03-01T00:00:00Z',
    '2026-03-31T23:59:59Z',
    true
  );

insert into public.recurring_bookings (
  id,
  salon_id,
  customer_id,
  operator_id,
  status,
  recurrence_rule,
  next_occurrence_at,
  start_date,
  end_date,
  notes
)
values
  (
    '47000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '3F000000-0000-0000-0000-000000000001',
    '39000000-0000-0000-0000-000000000001',
    'active',
    'FREQ=WEEKLY;BYDAY=FR;BYHOUR=18;BYMINUTE=0',
    '2026-03-20T18:00:00Z',
    '2026-03-20',
    '2026-06-26',
    'Taglio ricorrente ogni due settimane gestito lato app.'
  );

insert into public.recurring_booking_services (id, salon_id, recurring_booking_id, service_id, sort_order)
values
  ('48000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '47000000-0000-0000-0000-000000000001', '3B000000-0000-0000-0000-000000000001', 1);

insert into public.waiting_list (
  id,
  salon_id,
  customer_id,
  operator_id,
  requested_date,
  requested_start_after,
  requested_end_before,
  notes,
  status,
  expires_at
)
values
  (
    '49000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '3F000000-0000-0000-0000-000000000002',
    '39000000-0000-0000-0000-000000000002',
    '2026-03-18',
    '17:00',
    '19:00',
    'Disponibile solo dopo il lavoro.',
    'active',
    '2026-03-18T19:00:00Z'
  );

insert into public.appointments (
  id,
  salon_id,
  customer_id,
  operator_id,
  recurring_booking_id,
  coupon_id,
  status,
  scheduled_date,
  start_at,
  end_at,
  buffer_minutes,
  total_duration_minutes,
  total_price_cents,
  notes,
  booked_by_role
)
values
  (
    '4A000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '3F000000-0000-0000-0000-000000000001',
    '39000000-0000-0000-0000-000000000001',
    null,
    '46000000-0000-0000-0000-000000000001',
    'confirmed',
    '2026-03-15',
    '2026-03-15T09:00:00Z',
    '2026-03-15T09:50:00Z',
    5,
    50,
    4300,
    'Include taglio e barba.',
    'customer'
  ),
  (
    '4A000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '3F000000-0000-0000-0000-000000000002',
    '39000000-0000-0000-0000-000000000002',
    null,
    null,
    'pending',
    '2026-03-16',
    '2026-03-16T15:00:00Z',
    '2026-03-16T15:45:00Z',
    5,
    45,
    3200,
    'Appuntamento in attesa di conferma.',
    'customer'
  ),
  (
    '4A000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000002',
    '3F000000-0000-0000-0000-000000000003',
    '39000000-0000-0000-0000-000000000003',
    null,
    '46000000-0000-0000-0000-000000000002',
    'confirmed',
    '2026-03-19',
    '2026-03-19T10:00:00Z',
    '2026-03-19T10:40:00Z',
    5,
    40,
    3000,
    'Prenotazione demo.',
    'customer'
  );

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
values
  ('4B000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '4A000000-0000-0000-0000-000000000001', '3B000000-0000-0000-0000-000000000001', 'Taglio Uomo', 2500, 30, 1),
  ('4B000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '4A000000-0000-0000-0000-000000000001', '3B000000-0000-0000-0000-000000000002', 'Barba Premium', 1800, 20, 2),
  ('4B000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '4A000000-0000-0000-0000-000000000003', '3B000000-0000-0000-0000-000000000004', 'Taglio Demo', 3000, 40, 1);

insert into public.coupon_redemptions (
  id,
  salon_id,
  coupon_id,
  customer_id,
  appointment_id,
  discount_amount
)
values
  (
    '4C000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '46000000-0000-0000-0000-000000000001',
    '3F000000-0000-0000-0000-000000000001',
    '4A000000-0000-0000-0000-000000000001',
    6.45
  );

insert into public.reviews (
  id,
  salon_id,
  customer_id,
  appointment_id,
  rating,
  title,
  body,
  is_published,
  published_at
)
values
  (
    '4D000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '3F000000-0000-0000-0000-000000000001',
    '4A000000-0000-0000-0000-000000000001',
    5,
    'Servizio impeccabile',
    'Prenotazione semplice, orario rispettato e risultato ottimo.',
    true,
    '2026-03-15T11:30:00Z'
  );

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
  provider_name,
  sent_at
)
values
  (
    '4E000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '3F000000-0000-0000-0000-000000000001',
    '4A000000-0000-0000-0000-000000000001',
    'email',
    'booking_confirmed',
    'anna.ferrari@example.com',
    '{"salonName":"Barberia Rossi","appointmentStart":"2026-03-15T09:00:00Z"}',
    'sent',
    'resend',
    '2026-03-10T08:00:00Z'
  ),
  (
    '4E000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '3F000000-0000-0000-0000-000000000002',
    '4A000000-0000-0000-0000-000000000002',
    'push',
    'booking_pending',
    'expo-push-token-placeholder',
    '{"salonName":"Barberia Rossi","appointmentStart":"2026-03-16T15:00:00Z"}',
    'queued',
    'expo',
    null
  );

insert into public.audit_logs (
  id,
  salon_id,
  actor_auth_user_id,
  actor_role,
  action,
  entity_type,
  entity_id,
  metadata,
  created_at
)
values
  (
    '4F000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'super_admin',
    'salon.created',
    'salons',
    '30000000-0000-0000-0000-000000000001',
    '{"source":"seed"}',
    '2026-01-01T09:00:00Z'
  ),
  (
    '4F000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000101',
    'salon_owner',
    'service.updated',
    'services',
    '3B000000-0000-0000-0000-000000000001',
    '{"field":"price_cents","old":2300,"new":2500}',
    '2026-03-01T08:30:00Z'
  );

insert into public.access_logs (
  id,
  salon_id,
  actor_auth_user_id,
  actor_role,
  access_channel,
  email,
  success,
  failure_reason,
  created_at
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    null,
    '20000000-0000-0000-0000-000000000001',
    'super_admin',
    'web',
    'admin@platforma.it',
    true,
    null,
    '2026-03-10T07:30:00Z'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000201',
    'customer',
    'mobile',
    'anna.ferrari@example.com',
    true,
    null,
    '2026-03-10T08:05:00Z'
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000103',
    'salon_owner',
    'web',
    'luca@saloneverdi.it',
    false,
    'salon_suspended',
    '2026-03-10T09:00:00Z'
  );

insert into public.export_jobs (
  id,
  salon_id,
  requested_by_auth_user_id,
  requested_by_role,
  export_type,
  file_format,
  status,
  filters,
  file_path,
  created_at,
  completed_at
)
values
  (
    '51000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000101',
    'salon_owner',
    'customers',
    'csv',
    'completed',
    '{"segment":"all"}',
    'exports/barberia-rossi/customers-2026-03-01.csv',
    '2026-03-01T18:00:00Z',
    '2026-03-01T18:01:00Z'
  );

insert into public.build_jobs (
  id,
  salon_id,
  requested_by_auth_user_id,
  requested_by_role,
  target,
  environment_mode,
  status,
  payload,
  created_at,
  completed_at
)
values
  (
    '52000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'super_admin',
    'all',
    'demo',
    'completed',
    '{"profile":"preview","version":"1.0.0-demo"}',
    '2026-03-03T12:00:00Z',
    '2026-03-03T12:25:00Z'
  );

insert into public.file_assets (
  id,
  salon_id,
  bucket_name,
  asset_path,
  asset_kind,
  mime_type,
  size_bytes,
  uploaded_by_auth_user_id
)
values
  (
    '53000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'branding',
    'branding/barberia-rossi/logo.png',
    'logo',
    'image/png',
    24567,
    '20000000-0000-0000-0000-000000000001'
  ),
  (
    '53000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    'portfolio',
    'portfolio/barberia-rossi/fade-1.jpg',
    'portfolio',
    'image/jpeg',
    145678,
    '20000000-0000-0000-0000-000000000101'
  );
