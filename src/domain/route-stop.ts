export type RouteStopStatus =
  | "DE_LIVRAT"
  | "PLECAT"
  | "AJUNS"
  | "LIVRAT"
  | "REFUZAT"
  | "RETUR_PARTIAL"
  | "ANULAT";

export interface RouteStop {
  id: string;
  orderId: string;
  status: RouteStopStatus;
}

export function canChangeStatus(
  current: RouteStopStatus,
  next: RouteStopStatus
): boolean {
  const allowed: Record<RouteStopStatus, RouteStopStatus[]> = {
    DE_LIVRAT: ["PLECAT", "ANULAT"],
    PLECAT: ["AJUNS", "ANULAT"],
    AJUNS: ["LIVRAT", "REFUZAT", "ANULAT"],
    LIVRAT: ["RETUR_PARTIAL"],
    REFUZAT: [],
    RETUR_PARTIAL: [],
    ANULAT: []
  };

  return allowed[current].includes(next);
}
