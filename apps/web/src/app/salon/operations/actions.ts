"use server";

import { revalidatePath } from "next/cache";

import {
  addRecurringBooking,
  addWaitingListEntry,
  flushQueuedPushNotifications,
  queueCustomerPushNotification,
  requestExport
} from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

export async function createWaitingListAction(formData: FormData) {
  const session = await requireOwnerSession();

  await addWaitingListEntry(session.salonId, {
    customerId: String(formData.get("customerId")),
    operatorId: String(formData.get("operatorId") || "") || undefined,
    requestedDate: String(formData.get("requestedDate")),
    requestedStartAfter: String(formData.get("requestedStartAfter") || "") || undefined,
    requestedEndBefore: String(formData.get("requestedEndBefore") || "") || undefined,
    notes: String(formData.get("notes") || "") || undefined
  });

  revalidatePath("/salon/operations");
}

export async function createRecurringBookingAction(formData: FormData) {
  const session = await requireOwnerSession();
  const serviceIds = formData.getAll("serviceIds").map(String).filter(Boolean);

  await addRecurringBooking(session.salonId, {
    customerId: String(formData.get("customerId")),
    operatorId: String(formData.get("operatorId") || "") || undefined,
    recurrenceRule: String(formData.get("recurrenceRule")),
    startDate: String(formData.get("startDate")),
    endDate: String(formData.get("endDate") || "") || undefined,
    notes: String(formData.get("notes") || "") || undefined,
    serviceIds
  });

  revalidatePath("/salon/operations");
}

export async function queueNotificationAction(formData: FormData) {
  const session = await requireOwnerSession();
  const eventKey = String(formData.get("eventKey"));
  const customerId = String(formData.get("customerId"));
  const customerName = String(formData.get("customerName") || "") || undefined;

  const title =
    eventKey === "booking_reminder"
      ? `${session.salonName} - reminder appuntamento`
      : `${session.salonName} - prenotazione confermata`;

  const body =
    eventKey === "booking_reminder"
      ? `Promemoria appuntamento per ${customerName ?? "cliente"}.`
      : `Nuovo aggiornamento prenotazione per ${customerName ?? "cliente"}.`;

  await queueCustomerPushNotification(session.salonId, {
    customerId,
    appointmentId: String(formData.get("appointmentId") || "") || undefined,
    eventKey,
    title,
    body,
    payload: { salonName: session.salonName, screen: "appointments" }
  });

  revalidatePath("/salon/operations");
}

export async function dispatchPushQueueAction() {
  const session = await requireOwnerSession();

  await flushQueuedPushNotifications(session.salonId);

  revalidatePath("/salon/operations");
}

export async function requestExportAction(formData: FormData) {
  const session = await requireOwnerSession();

  await requestExport(session.salonId, {
    exportType: String(formData.get("exportType")),
    fileFormat: String(formData.get("fileFormat")) as "csv" | "pdf"
  });

  revalidatePath("/salon/operations");
}
