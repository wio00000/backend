import express, { type Response } from "express";
import { isRouteStopStatus, type RouteStopStatus } from "../domain/route-stop";
import { RouteStopRepository } from "../repositories/route-stop-repository";
import {
  InMemoryDeliveryEventPublisher,
  RouteStopService,
  type OfflineRouteStopEvent
} from "../services/route-stop-service";

export function createApp(
  repository = new RouteStopRepository(),
  eventPublisher = new InMemoryDeliveryEventPublisher()
): express.Express {
  const app = express();
  const service = new RouteStopService(repository, eventPublisher);

  app.use(express.json());

  app.patch("/route-stops/:id/status", (request, response) => {
    const { status } = request.body as { status?: unknown };

    if (!isRouteStopStatus(status)) {
      response.status(400).json({ error: "Status invalid" });
      return;
    }

    try {
      const updatedStop = service.changeStatus(request.params.id, status);
      response.json(updatedStop);
    } catch (error) {
      if (error instanceof Error && error.message === "Oprirea nu a fost gasita") {
        response.status(404).json({ error: error.message });
        return;
      }

      if (error instanceof Error) {
        response.status(409).json({ error: error.message });
        return;
      }

      sendInternalError(response);
    }
  });

  app.post("/route-stops/sync", (request, response) => {
    const events = parseOfflineEvents(request.body);

    if (!events) {
      response.status(400).json({
        error: "Pachet invalid. Sunt necesare evenimente cu eventId, stopId, status si occurredAt."
      });
      return;
    }

    response.json(service.synchronize(events));
  });

  return app;
}

function parseOfflineEvents(body: unknown): OfflineRouteStopEvent[] | undefined {
  if (!body || typeof body !== "object" || !Array.isArray((body as { events?: unknown }).events)) {
    return undefined;
  }

  const events = (body as { events: unknown[] }).events;
  if (
    events.some((event): event is undefined => {
      if (!event || typeof event !== "object") {
        return true;
      }

      const candidate = event as Record<string, unknown>;
      return (
        typeof candidate.eventId !== "string" ||
        typeof candidate.stopId !== "string" ||
        typeof candidate.occurredAt !== "string" ||
        Number.isNaN(Date.parse(candidate.occurredAt)) ||
        !isDriverStatus(candidate.status)
      );
    })
  ) {
    return undefined;
  }

  return events as OfflineRouteStopEvent[];
}

function isDriverStatus(value: unknown): value is Exclude<RouteStopStatus, "DE_LIVRAT" | "ANULAT"> {
  return (
    isRouteStopStatus(value) &&
    value !== "DE_LIVRAT" &&
    value !== "ANULAT"
  );
}

function sendInternalError(response: Response): void {
  response.status(500).json({ error: "Eroare interna" });
}
