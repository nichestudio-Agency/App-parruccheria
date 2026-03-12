import { getBlockedSlots, getBusinessHours, getUpcomingAppointments } from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

import { createBlockedSlotAction, upsertBusinessHoursAction } from "./actions";

const dayLabels = ["Domenica", "Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato"];

export default async function AgendaPage() {
  const session = await requireOwnerSession();
  const [appointments, blockedSlots, businessHours] = await Promise.all([
    getUpcomingAppointments(session.salonId),
    getBlockedSlots(session.salonId),
    getBusinessHours(session.salonId)
  ]);

  return (
    <div className="stack-lg">
      <section className="panel stack-md">
        <div className="stack-xs">
          <p className="eyebrow">Agenda</p>
          <h2>Appuntamenti e blocchi</h2>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Operatore</th>
                <th>Servizi</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{new Date(appointment.start_at).toLocaleString("it-IT")}</td>
                  <td>{appointment.customer_name}</td>
                  <td>{appointment.operator_name}</td>
                  <td>{appointment.services_label}</td>
                  <td>{appointment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-grid">
        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Blocco manuale</p>
            <h3>Aggiungi blocco agenda</h3>
          </div>

          <form action={createBlockedSlotAction} className="stack-sm">
            <label className="field">
              <span>Inizio</span>
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label className="field">
              <span>Fine</span>
              <input name="endsAt" type="datetime-local" required />
            </label>
            <label className="field">
              <span>Motivo</span>
              <input name="reason" placeholder="Formazione, pausa, chiusura straordinaria" />
            </label>
            <button className="button button--primary" type="submit">
              Crea blocco
            </button>
          </form>

          <div className="stack-sm">
            {blockedSlots.map((slot) => (
              <div className="detail-item" key={slot.id}>
                <strong>{slot.reason ?? "Blocco senza motivo"}</strong>
                <span className="muted">
                  {new Date(slot.starts_at).toLocaleString("it-IT")} -{" "}
                  {new Date(slot.ends_at).toLocaleString("it-IT")}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Orari</p>
            <h3>Configura giornata</h3>
          </div>

          <form action={upsertBusinessHoursAction} className="stack-sm">
            <label className="field">
              <span>Giorno</span>
              <select name="dayOfWeek">
                {dayLabels.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Apertura</span>
              <input name="opensAt" type="time" />
            </label>
            <label className="field">
              <span>Chiusura</span>
              <input name="closesAt" type="time" />
            </label>
            <label className="field">
              <span>Inizio pausa</span>
              <input name="breakStartAt" type="time" />
            </label>
            <label className="field">
              <span>Fine pausa</span>
              <input name="breakEndAt" type="time" />
            </label>
            <label className="field">
              <span>
                <input name="isClosed" type="checkbox" /> Giorno chiuso
              </span>
            </label>
            <button className="button" type="submit">
              Salva orario
            </button>
          </form>

          <div className="stack-sm">
            {businessHours.map((entry) => (
              <div className="detail-item" key={entry.id}>
                <strong>{dayLabels[entry.day_of_week]}</strong>
                <span className="muted">
                  {entry.is_closed
                    ? "Chiuso"
                    : `${entry.opens_at ?? "--"} - ${entry.closes_at ?? "--"}`}
                </span>
                <span className="muted">
                  Pausa: {entry.break_start_at ?? "--"} - {entry.break_end_at ?? "--"}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
