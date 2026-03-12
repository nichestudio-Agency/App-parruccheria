import {
  getCustomers,
  getExportJobs,
  getNotificationLogs,
  getOperators,
  getRecurringBookings,
  getServices,
  getWaitingListEntries
} from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

import {
  createRecurringBookingAction,
  createWaitingListAction,
  queueNotificationAction,
  requestExportAction
} from "./actions";

export default async function OperationsPage() {
  const session = await requireOwnerSession();
  const [customers, operators, services, waitingList, recurringBookings, notificationLogs, exportJobs] =
    await Promise.all([
      getCustomers(session.salonId),
      getOperators(session.salonId),
      getServices(session.salonId),
      getWaitingListEntries(session.salonId),
      getRecurringBookings(session.salonId),
      getNotificationLogs(session.salonId),
      getExportJobs(session.salonId)
    ]);

  return (
    <div className="stack-lg">
      <section className="panel stack-lg">
        <div className="stack-xs">
          <p className="eyebrow">Fase 7</p>
          <h2>Operazioni automatiche e retention</h2>
          <p className="muted">
            Gestione waiting list, prenotazioni ricorrenti, coda notifiche ed export operativi del
            salone.
          </p>
        </div>
      </section>

      <section className="panel stack-lg">
        <div className="stack-xs">
          <p className="eyebrow">Waiting list</p>
          <h3>Richieste in attesa</h3>
        </div>

        <form action={createWaitingListAction} className="detail-grid">
          <label className="field">
            <span>Cliente</span>
            <select name="customerId" required>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Operatore</span>
            <select name="operatorId">
              <option value="">Qualsiasi</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Data richiesta</span>
            <input name="requestedDate" required type="date" />
          </label>
          <label className="field">
            <span>Dalle</span>
            <input name="requestedStartAfter" type="time" />
          </label>
          <label className="field">
            <span>Entro</span>
            <input name="requestedEndBefore" type="time" />
          </label>
          <label className="field">
            <span>Note</span>
            <input name="notes" placeholder="Finestra preferita o urgenza" />
          </label>
          <div className="actions-inline">
            <button className="button button--primary" type="submit">
              Aggiungi in waiting list
            </button>
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Data</th>
                <th>Finestra</th>
                <th>Operatore</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {waitingList.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.customer_name}</td>
                  <td>{entry.requested_date}</td>
                  <td>
                    {entry.requested_start_after ?? "--"} / {entry.requested_end_before ?? "--"}
                  </td>
                  <td>{entry.operator_name ?? "Qualsiasi"}</td>
                  <td>{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack-lg">
        <div className="stack-xs">
          <p className="eyebrow">Ricorrenze</p>
          <h3>Prenotazioni ricorrenti</h3>
        </div>

        <form action={createRecurringBookingAction} className="detail-grid">
          <label className="field">
            <span>Cliente</span>
            <select name="customerId" required>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Operatore</span>
            <select name="operatorId">
              <option value="">Qualsiasi</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Regola</span>
            <select name="recurrenceRule" required>
              <option value="FREQ=WEEKLY;INTERVAL=1">Ogni settimana</option>
              <option value="FREQ=WEEKLY;INTERVAL=2">Ogni 2 settimane</option>
              <option value="FREQ=MONTHLY;INTERVAL=1">Ogni mese</option>
            </select>
          </label>
          <label className="field">
            <span>Data inizio</span>
            <input name="startDate" required type="date" />
          </label>
          <label className="field">
            <span>Data fine</span>
            <input name="endDate" type="date" />
          </label>
          <label className="field">
            <span>Note</span>
            <input name="notes" placeholder="Preferenze servizio o orario" />
          </label>
          <div className="field">
            <span>Servizi inclusi</span>
            <div className="stack-xs">
              {services.map((service) => (
                <label key={service.id} className="muted">
                  <input defaultChecked name="serviceIds" type="checkbox" value={service.id} />{" "}
                  {service.name}
                </label>
              ))}
            </div>
          </div>
          <div className="actions-inline">
            <button className="button button--primary" type="submit">
              Crea ricorrenza
            </button>
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servizi</th>
                <th>Regola</th>
                <th>Prossima</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {recurringBookings.map((item) => (
                <tr key={item.id}>
                  <td>{item.customer_name}</td>
                  <td>{item.service_names ?? "n/d"}</td>
                  <td>{item.recurrence_rule}</td>
                  <td>{item.next_occurrence_at ?? "Da calcolare"}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack-lg">
        <div className="stack-xs">
          <p className="eyebrow">Notifiche</p>
          <h3>Coda notifiche base</h3>
        </div>

        <form action={queueNotificationAction} className="detail-grid">
          <label className="field">
            <span>Canale</span>
            <select name="channel" required>
              <option value="email">Email</option>
              <option value="push">Push</option>
            </select>
          </label>
          <label className="field">
            <span>Evento</span>
            <select name="eventKey" required>
              <option value="booking_confirmation">Conferma prenotazione</option>
              <option value="booking_reminder">Reminder prenotazione</option>
            </select>
          </label>
          <label className="field">
            <span>Cliente</span>
            <select name="customerId">
              <option value="">Nessuno</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Nome cliente</span>
            <input name="customerName" placeholder="Usato nel testo del messaggio" />
          </label>
          <label className="field">
            <span>Destinatario</span>
            <input name="recipient" placeholder="email o device token" required />
          </label>
          <div className="actions-inline">
            <button className="button button--primary" type="submit">
              Metti in coda
            </button>
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Canale</th>
                <th>Evento</th>
                <th>Destinatario</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {notificationLogs.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString("it-IT")}</td>
                  <td>{item.channel}</td>
                  <td>{item.event_key}</td>
                  <td>{item.recipient}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack-lg">
        <div className="stack-xs">
          <p className="eyebrow">Export</p>
          <h3>Esportazioni dati</h3>
        </div>

        <form action={requestExportAction} className="detail-grid">
          <label className="field">
            <span>Tipo export</span>
            <select name="exportType" required>
              <option value="customers">Clienti</option>
              <option value="appointments">Appuntamenti</option>
              <option value="reviews">Recensioni</option>
            </select>
          </label>
          <label className="field">
            <span>Formato</span>
            <select name="fileFormat" required>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
          <div className="actions-inline">
            <button className="button button--primary" type="submit">
              Richiedi export
            </button>
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Formato</th>
                <th>Stato</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {exportJobs.map((job) => (
                <tr key={job.id}>
                  <td>{new Date(job.created_at).toLocaleString("it-IT")}</td>
                  <td>{job.export_type}</td>
                  <td>{job.file_format}</td>
                  <td>{job.status}</td>
                  <td>{job.file_path ?? "In coda"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
