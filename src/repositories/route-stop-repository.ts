import type { RouteStop } from "../domain/route-stop";

export class RouteStopRepository {
  private readonly stops = new Map<string, RouteStop>();

  findById(id: string): RouteStop | undefined {
    return this.stops.get(id);
  }

  save(stop: RouteStop): RouteStop {
    this.stops.set(stop.id, stop);
    return stop;
  }
}
