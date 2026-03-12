import { getCoupons, getPromotions } from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

import { createCouponAction, createPromotionAction } from "./actions";

export default async function PromotionsPage() {
  const session = await requireOwnerSession();
  const [promotions, coupons] = await Promise.all([
    getPromotions(session.salonId),
    getCoupons(session.salonId)
  ]);

  return (
    <div className="stack-lg">
      <section className="detail-grid">
        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Promozioni</p>
            <h2>Offerte attive</h2>
          </div>

          <div className="stack-sm">
            {promotions.map((promotion) => (
              <div className="detail-item" key={promotion.id}>
                <strong>{promotion.title}</strong>
                <span className="muted">
                  {promotion.discount_type} • {promotion.discount_value}
                </span>
                <span className="muted">
                  {new Date(promotion.starts_at).toLocaleDateString("it-IT")} -{" "}
                  {new Date(promotion.ends_at).toLocaleDateString("it-IT")}
                </span>
              </div>
            ))}
          </div>

          <form action={createPromotionAction} className="stack-sm">
            <label className="field">
              <span>Titolo</span>
              <input name="title" required />
            </label>
            <label className="field">
              <span>Tipo sconto</span>
              <select name="discountType">
                <option value="percentage">percentage</option>
                <option value="fixed_amount">fixed_amount</option>
              </select>
            </label>
            <label className="field">
              <span>Valore sconto</span>
              <input min="1" name="discountValue" step="1" type="number" required />
            </label>
            <label className="field">
              <span>Inizio</span>
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label className="field">
              <span>Fine</span>
              <input name="endsAt" type="datetime-local" required />
            </label>
            <button className="button button--primary" type="submit">
              Crea promozione
            </button>
          </form>
        </article>

        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Coupon</p>
            <h2>Codici sconto</h2>
          </div>

          <div className="stack-sm">
            {coupons.map((coupon) => (
              <div className="detail-item" key={coupon.id}>
                <strong>{coupon.code}</strong>
                <span className="muted">
                  {coupon.title} • {coupon.discount_type} • {coupon.discount_value}
                </span>
              </div>
            ))}
          </div>

          <form action={createCouponAction} className="stack-sm">
            <label className="field">
              <span>Codice</span>
              <input name="code" required />
            </label>
            <label className="field">
              <span>Titolo</span>
              <input name="title" required />
            </label>
            <label className="field">
              <span>Tipo sconto</span>
              <select name="discountType">
                <option value="percentage">percentage</option>
                <option value="fixed_amount">fixed_amount</option>
              </select>
            </label>
            <label className="field">
              <span>Valore sconto</span>
              <input min="1" name="discountValue" step="1" type="number" required />
            </label>
            <label className="field">
              <span>Inizio</span>
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label className="field">
              <span>Fine</span>
              <input name="endsAt" type="datetime-local" required />
            </label>
            <button className="button" type="submit">
              Crea coupon
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
