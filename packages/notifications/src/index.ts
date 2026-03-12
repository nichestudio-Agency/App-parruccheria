export interface NotificationTemplateInput {
  salonName: string;
  customerName?: string;
}

export function buildBookingConfirmationSubject(input: NotificationTemplateInput): string {
  return `${input.salonName} - prenotazione confermata`;
}

export function buildReminderSubject(input: NotificationTemplateInput): string {
  return `${input.salonName} - reminder appuntamento`;
}
