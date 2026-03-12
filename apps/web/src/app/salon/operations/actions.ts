"use server";

import { revalidatePath } from "next/cache";

import {
  addRecurringBooking,
  addWaitingListEntry,
  queueNotification,
  requestExport
} from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";
import { buildBookingConfirmationSubject, buildReminderSubject } from "@repo/notifications";

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
  const recipient = String(formData.get("recipient"));
  const eventKey = String(formData.get("eventKey"));
  const channel = String(formData.get("channel")) as "email" | "push";
  const customerName = String(formData.get("customerName") || "") || undefined;

  const subject =
    eventKey === "booking_reminder"
      ? buildReminderSubject({ salonName: session.salonName, customerName })
      : buildBookingConfirmationSubject({ salonName: session.salonName, customerName });

  await queueNotification(session.salonId, {
    customerId: String(formData.get("customerId") || "") || undefined,
    appointmentId: String(formData.get("appointmentId") || "") || undefined,
    channel,
    eventKey,
    recipient,
    payload: {
      subject,
      salonName: session.salonName
    }
  });

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
