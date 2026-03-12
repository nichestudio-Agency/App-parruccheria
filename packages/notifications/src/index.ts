export interface NotificationTemplateInput {
  salonName: string;
  customerName?: string;
}

export interface ExpoPushMessageInput {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

export function buildBookingConfirmationSubject(input: NotificationTemplateInput): string {
  return `${input.salonName} - prenotazione confermata`;
}

export function buildReminderSubject(input: NotificationTemplateInput): string {
  return `${input.salonName} - reminder appuntamento`;
}

export function buildExpoPushMessages(messages: ExpoPushMessageInput[]) {
  return messages.map((message) => ({
    to: message.to,
    sound: "default",
    title: message.title,
    body: message.body,
    data: message.data ?? {}
  }));
}

export async function sendExpoPushMessages(
  messages: ReturnType<typeof buildExpoPushMessages>,
  accessToken?: string
): Promise<{ data: ExpoPushTicket[] }> {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(messages)
  });

  if (!response.ok) {
    throw new Error(`Expo push request failed with status ${response.status}.`);
  }

  return (await response.json()) as { data: ExpoPushTicket[] };
}
