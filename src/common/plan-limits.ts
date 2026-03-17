export const PLAN_MONTHLY_LIMITS: Record<string, number> = {
  FREE: 50,
  PRO: 500,
  BUSINESS: -1, // -1 = unlimited
};

export function getMonthlyLimit(plan: string): number {
  return PLAN_MONTHLY_LIMITS[plan] ?? PLAN_MONTHLY_LIMITS.FREE;
}

export function isUnlimited(plan: string): boolean {
  return getMonthlyLimit(plan) === -1;
}
