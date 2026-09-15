import assert from "node:assert/strict";
import test from "node:test";
import type { RouteStop } from "../domain/route-stop";
import { updateStopStatus } from "./route-stop-service";

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
    () => updateStopStatus(stop, "LIVRAT"),
  );
});
