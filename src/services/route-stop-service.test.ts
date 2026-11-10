import assert from "node:assert/strict";
import test from "node:test";
import type { RouteStop } from "../domain/route-stop";
import { RouteStopRepository } from "../repositories/route-stop-repository";
import {
  InMemoryDeliveryEventPublisher,
  RouteStopService,
  updateStopStatus
} from "./route-stop-service";

test("schimba statusul pentru o tranzitie permisa", () => {
  const stop: RouteStop = {
    id: "stop-1",
    orderId: "order-1",
    status: "DE_LIVRAT"
  };

  const updatedStop = updateStopStatus(stop, "PLECAT");

  assert.equal(updatedStop.status, "PLECAT");
  assert.equal(stop.status, "DE_LIVRAT");
});

test("respinge o tranzitie nepermisa", () => {
  const stop: RouteStop = {
    id: "stop-1",
    orderId: "order-1",
    status: "DE_LIVRAT"
  };

  assert.throws(
    () => updateStopStatus(stop, "LIVRAT")
  );
});

test("cauta si salveaza oprirea prin repository", () => {
  const repository = new RouteStopRepository();
  const service = new RouteStopService(repository);

  repository.save({
    id: "stop-2",
    orderId: "order-2",
    status: "DE_LIVRAT"
  });

  const updatedStop = service.changeStatus("stop-2", "PLECAT");

  assert.equal(updatedStop.status, "PLECAT");
  assert.equal(repository.findById("stop-2")?.status, "PLECAT");
});

test("respinge o oprire inexistenta", () => {
  const service = new RouteStopService(new RouteStopRepository());

  assert.throws(
    () => service.changeStatus("stop-inexistent", "PLECAT"),
    /Oprirea nu a fost gasita/
  );
});

test("sincronizeaza evenimentele offline in ordinea producerii", () => {
  const repository = new RouteStopRepository();
  const service = new RouteStopService(repository);

  repository.save({
    id: "stop-3",
    orderId: "order-3",
    status: "DE_LIVRAT"
  });

  const result = service.synchronize([
    {
      eventId: "event-2",
      stopId: "stop-3",
      status: "AJUNS",
      occurredAt: "2026-11-10T10:02:00.000Z"
    },
    {
      eventId: "event-1",
      stopId: "stop-3",
      status: "PLECAT",
      occurredAt: "2026-11-10T10:01:00.000Z"
    },
    {
      eventId: "event-3",
      stopId: "stop-3",
      status: "LIVRAT",
      occurredAt: "2026-11-10T10:03:00.000Z"
    }
  ]);

  assert.deepEqual(result.applied, ["event-1", "event-2", "event-3"]);
  assert.equal(repository.findById("stop-3")?.status, "LIVRAT");
});

test("nu reinvie o oprire anulata si emite evenimentul de decont", () => {
  const repository = new RouteStopRepository();
  const publisher = new InMemoryDeliveryEventPublisher();
  const service = new RouteStopService(repository, publisher);

  repository.save({
    id: "stop-4",
    orderId: "order-4",
    status: "ANULAT"
  });

  const result = service.synchronize([
    {
      eventId: "event-cancelled",
      stopId: "stop-4",
      status: "AJUNS",
      occurredAt: "2026-11-10T10:00:00.000Z"
    }
  ]);

  assert.deepEqual(result.ignored, [{ eventId: "event-cancelled", reason: "STOP_ANULAT" }]);
  assert.equal(repository.findById("stop-4")?.status, "ANULAT");

  repository.save({
    id: "stop-5",
    orderId: "order-5",
    status: "AJUNS"
  });
  service.synchronize([
    {
      eventId: "event-delivered",
      stopId: "stop-5",
      status: "LIVRAT",
      occurredAt: "2026-11-10T10:05:00.000Z"
    }
  ]);

  assert.deepEqual(publisher.events, [{
    type: "DELIVERY_COMPLETED",
    stopId: "stop-5",
    orderId: "order-5",
    deliveredAt: "2026-11-10T10:05:00.000Z"
  }]);
});

test("ignora acelasi eveniment offline trimis de doua ori", () => {
  const repository = new RouteStopRepository();
  const service = new RouteStopService(repository);

  repository.save({
    id: "stop-6",
    orderId: "order-6",
    status: "DE_LIVRAT"
  });

  const event = {
    eventId: "event-duplicate",
    stopId: "stop-6",
    status: "PLECAT" as const,
    occurredAt: "2026-11-10T10:00:00.000Z"
  };

  service.synchronize([event]);
  const result = service.synchronize([event]);

  assert.deepEqual(result.ignored, [{ eventId: "event-duplicate", reason: "DUPLICAT" }]);
});
