create or replace function public.enqueue_due_push_reminders(
  p_target_salon_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_count integer := 0;
begin
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
    a.salon_id,
    a.customer_id,
    a.id,
    'push',
    reminder.event_key,
    cpd.expo_push_token,
    jsonb_build_object(
      'title', 'Reminder appuntamento',
      'body',
        format(
          'Hai un appuntamento presso %s il %s.',
          coalesce(s.name, 'il salone'),
          to_char(a.start_at at time zone 'Europe/Rome', 'DD/MM HH24:MI')
        ),
      'data',
        jsonb_build_object(
          'screen', 'appointments',
          'eventKey', reminder.event_key,
          'appointmentId', a.id,
          'salonId', a.salon_id,
          'customerId', a.customer_id
        )
    ),
    'queued',
    'expo'
  from public.appointments a
  join public.salons s on s.id = a.salon_id
  join public.customer_push_devices cpd
    on cpd.salon_id = a.salon_id
   and cpd.customer_id = a.customer_id
   and cpd.is_active = true
  left join public.salon_demo_configs sdc on sdc.salon_id = a.salon_id
  cross join lateral (
    values
      ('appointment.reminder_24h'::text, interval '24 hours', interval '23 hours'),
      ('appointment.reminder_2h'::text, interval '2 hours', interval '1 hour')
  ) as reminder(event_key, upper_bound, lower_bound)
  where a.status in ('pending', 'confirmed')
    and s.status = 'active'
    and (p_target_salon_id is null or a.salon_id = p_target_salon_id)
    and coalesce(sdc.notifications_suppressed, false) = false
    and a.start_at > timezone('utc', now())
    and a.start_at <= timezone('utc', now()) + reminder.upper_bound
    and a.start_at > timezone('utc', now()) + reminder.lower_bound
    and not exists (
      select 1
      from public.notification_logs nl
      where nl.salon_id = a.salon_id
        and nl.appointment_id = a.id
        and nl.customer_id = a.customer_id
        and nl.channel = 'push'
        and nl.event_key = reminder.event_key
        and nl.recipient = cpd.expo_push_token
        and nl.status in ('queued', 'sent')
    );

  get diagnostics v_inserted_count = row_count;
  return coalesce(v_inserted_count, 0);
end;
$$;

revoke all on function public.enqueue_due_push_reminders(uuid) from public;
grant execute on function public.enqueue_due_push_reminders(uuid) to authenticated;
