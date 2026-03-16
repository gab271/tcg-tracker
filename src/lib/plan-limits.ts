export const PLAN_LIMITS = {
  FREE: {
    maxCards: 100,
    maxDecks: 3,
    maxListings: 5,
  },
  PRO: {
    maxCards: Infinity,
    maxDecks: Infinity,
    maxListings: Infinity,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
