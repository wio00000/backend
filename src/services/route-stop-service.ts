import {
  canChangeStatus,
  type RouteStop,
  type RouteStopStatus
} from "../domain/route-stop";

export function updateStopStatus(
  stop: RouteStop,
  nextStatus: RouteStopStatus
): RouteStop {
  if (!canChangeStatus(stop.status, nextStatus)) {
    throw new Error(
      `Schimbare de status nepermisa: ${stop.status} -> ${nextStatus}`
    );
  }

  return {
    ...stop,
    status: nextStatus
  };
}
