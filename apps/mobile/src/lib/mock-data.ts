import type {
  CustomerAppointment,
  CustomerProfile,
  CustomerReview,
  PromotionCoupon,
  SalonOperator,
  SalonPortfolioItem,
  SalonPromotion,
  SalonService
} from "@repo/types";

export const initialOperators: SalonOperator[] = [
  {
    id: "op-marco",
    displayName: "Marco Rossi",
    specialty: "Fade, barba e ritocchi premium",
    colorHex: "#99692d"
  },
  {
    id: "op-luca",
    displayName: "Luca Bianchi",
    specialty: "Taglio classico e grooming executive",
    colorHex: "#325863"
  },
  {
    id: "op-sara",
    displayName: "Sara Moretti",
    specialty: "Styling e texture control",
    colorHex: "#7f5a2f"
  }
];

export const initialServices: SalonService[] = [
  {
    id: "srv-taglio-signature",
    name: "Taglio Signature",
    categoryName: "Capelli",
    durationMinutes: 40,
    priceCents: 2800
  },
  {
    id: "srv-barba-premium",
    name: "Barba Premium",
    categoryName: "Barba",
    durationMinutes: 25,
    priceCents: 1800
  },
  {
    id: "srv-combo-executive",
    name: "Combo Executive",
    categoryName: "Combo",
    durationMinutes: 70,
    priceCents: 4500
  }
];

export const initialPortfolio: SalonPortfolioItem[] = [
  {
    id: "pf-1",
    title: "Fade strutturato",
    caption: "Taglio pulito con finitura naturale, ideale per una routine business.",
    imageHint: "portfolio-fade"
  },
  {
    id: "pf-2",
    title: "Barba scolpita",
    caption: "Contorni definiti e volume uniforme, con panno caldo finale.",
    imageHint: "portfolio-beard"
  },
  {
    id: "pf-3",
    title: "Texture moderna",
    caption: "Styling leggero per capelli mossi o spessi, con tenuta elegante.",
    imageHint: "portfolio-texture"
  }
];

export const initialPromotions: SalonPromotion[] = [
  {
    id: "promo-1",
    title: "Settimana opening",
    summary: "Sconto dedicato sul primo appuntamento in app.",
    discountLabel: "-15% sul primo servizio"
  },
  {
    id: "promo-2",
    title: "Combo barba + taglio",
    summary: "Formula bundle per aumentare ticket medio e ritorno cliente.",
    discountLabel: "Da 46 EUR a 41 EUR"
  }
];

export const initialCoupons: PromotionCoupon[] = [
  {
    id: "cp-1",
    code: "WELCOME15",
    title: "Benvenuto in app",
    expiresAtLabel: "31 Marzo"
  },
  {
    id: "cp-2",
    code: "SPRING10",
    title: "Promo grooming primavera",
    expiresAtLabel: "15 Aprile"
  }
];

export const initialAppointments: CustomerAppointment[] = [
  {
    id: "appt-1",
    salonId: "atelier-uomo-firenze",
    operatorName: "Marco Rossi",
    status: "confirmed",
    startsAtLabel: "18 Marzo alle 10:30",
    durationMinutes: 70,
    totalPriceCents: 4500,
    serviceNames: ["Combo Executive"],
    canReview: false
  },
  {
    id: "appt-2",
    salonId: "atelier-uomo-firenze",
    operatorName: "Luca Bianchi",
    status: "completed",
    startsAtLabel: "5 Marzo alle 15:00",
    durationMinutes: 40,
    totalPriceCents: 2800,
    serviceNames: ["Taglio Signature"],
    canReview: true
  }
];

export const initialReviews: CustomerReview[] = [
  {
    id: "rev-1",
    customerName: "Fabio",
    rating: 5,
    title: "Puntuale e preciso",
    body: "Esperienza ordinata, tempi rispettati e risultato coerente con il portfolio in app.",
    createdAtLabel: "Ieri"
  },
  {
    id: "rev-2",
    customerName: "Elena",
    rating: 5,
    title: "App semplice da usare",
    body: "Prenotazione rapida, scelta operatore chiara e promozione applicata senza frizioni.",
    createdAtLabel: "2 giorni fa"
  }
];

export const initialCustomer: CustomerProfile = {
  firstName: "Fabio",
  lastName: "Pace",
  email: "fabio.cliente@example.com",
  phone: "+39 333 1234567",
  birthDateLabel: "12 Ottobre 1993",
  preferences: ["Taglio pulito", "Reminder push", "Operatore preferito Marco"],
  privacyAccepted: true,
  marketingAccepted: false,
  authProvider: "email"
};
