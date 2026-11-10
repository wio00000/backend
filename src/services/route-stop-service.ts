import {
  canChangeStatus,
  type RouteStop,
  type RouteStopStatus
} from "../domain/route-stop";
import { RouteStopRepository } from "../repositories/route-stop-repository";

export interface DeliveryCompletedEvent {
  type: "DELIVERY_COMPLETED";
  stopId: string;
  orderId: string;
  deliveredAt: string;
}

export interface DeliveryEventPublisher {
  publish(event: DeliveryCompletedEvent): void;
}

export class InMemoryDeliveryEventPublisher implements DeliveryEventPublisher {
  readonly events: DeliveryCompletedEvent[] = [];

  publish(event: DeliveryCompletedEvent): void {
    this.events.push(event);
  }
}

export interface OfflineRouteStopEvent {
  eventId: string;
  stopId: string;
  status: Exclude<RouteStopStatus, "DE_LIVRAT" | "ANULAT">;
  occurredAt: string;
}

export interface SyncResult {
  applied: string[];
  ignored: Array<{ eventId: string; reason: "STOP_ANULAT" | "DUPLICAT" }>;
  rejected: Array<{ eventId: string; reason: string }>;
}

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

export class RouteStopService {
  private readonly processedEventIds = new Set<string>();

  constructor(
    private readonly repository: RouteStopRepository,
    private readonly eventPublisher: DeliveryEventPublisher = new InMemoryDeliveryEventPublisher()
  ) {}

  changeStatus(id: string, nextStatus: RouteStopStatus): RouteStop {
    const stop = this.repository.findById(id);

    if (!stop) {
      throw new Error("Oprirea nu a fost gasita");
    }

    const updatedStop = updateStopStatus(stop, nextStatus);
    const savedStop = this.repository.save(updatedStop);
    this.publishDeliveryCompleted(savedStop);
    return savedStop;
  }

  synchronize(events: OfflineRouteStopEvent[]): SyncResult {
    const result: SyncResult = {
      applied: [],
      ignored: [],
      rejected: []
    };

    events
      .map((event, index) => ({ event, index }))
      .sort((left, right) => {
        const byTime = Date.parse(left.event.occurredAt) - Date.parse(right.event.occurredAt);
        return byTime || left.index - right.index;
      })
      .forEach(({ event }) => {
        if (this.processedEventIds.has(event.eventId)) {
          result.ignored.push({ eventId: event.eventId, reason: "DUPLICAT" });
          return;
        }

        this.processedEventIds.add(event.eventId);
        const stop = this.repository.findById(event.stopId);

        if (!stop) {
          result.rejected.push({
            eventId: event.eventId,
            reason: "Oprirea nu a fost gasita"
          });
          return;
        }

        if (stop.status === "ANULAT") {
          result.ignored.push({ eventId: event.eventId, reason: "STOP_ANULAT" });
          return;
        }

        try {
          const updatedStop = updateStopStatus(stop, event.status);
          const savedStop = this.repository.save(updatedStop);
          this.publishDeliveryCompleted(savedStop, event.occurredAt);
          result.applied.push(event.eventId);
        } catch (error) {
          result.rejected.push({
            eventId: event.eventId,
            reason: error instanceof Error ? error.message : "Eroare necunoscuta"
          });
        }
      });

    return result;
  }

  private publishDeliveryCompleted(stop: RouteStop, deliveredAt = new Date().toISOString()): void {
    if (stop.status === "LIVRAT") {
      this.eventPublisher.publish({
        type: "DELIVERY_COMPLETED",
        stopId: stop.id,
        orderId: stop.orderId,
        deliveredAt
      });
    }
  }
}
