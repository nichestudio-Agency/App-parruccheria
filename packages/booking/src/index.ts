export interface BookingInput {
  serviceDurations: number[];
  bufferMinutes?: number;
}

export function calculateAppointmentDuration(input: BookingInput): number {
  const servicesTotal = input.serviceDurations.reduce((sum, value) => sum + value, 0);
  const buffer = input.bufferMinutes ?? 5;

  return servicesTotal + buffer;
}
