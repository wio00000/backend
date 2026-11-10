# Contract sincronizare opriri

## Endpoint

`POST /route-stops/sync`

Aplicația șoferului trimite evenimentele acumulate offline:

```json
{
  "events": [
    {
      "eventId": "device-123-1",
      "stopId": "stop-42",
      "status": "PLECAT",
      "occurredAt": "2026-11-10T10:01:00.000Z"
    }
  ]
}
```

`occurredAt` este ora producerii evenimentului pe dispozitiv, în format ISO
8601. Backendul sortează evenimentele crescător după această valoare și
folosește ordinea din pachet doar ca departajare.

Statusurile acceptate de la șofer sunt `PLECAT`, `AJUNS`, `LIVRAT`,
`REFUZAT` și `RETUR_PARTIAL`. `ANULAT` este status controlat de dispecer și
nu poate fi trimis de aplicația șoferului.

Răspunsul conține:

- `applied`: identificatorii aplicati cu succes;
- `ignored`: evenimente duplicate sau primite pentru opriri anulate;
- `rejected`: evenimente invalide pentru tranziția curentă sau pentru o
  oprire inexistentă.

`eventId` este idempotent. Dacă o oprire este anulată înainte de sincronizare,
evenimentul șoferului este ignorat și oprirea rămâne anulată.

La tranziția în `LIVRAT`, backendul publică evenimentul:

```json
{
  "type": "DELIVERY_COMPLETED",
  "stopId": "stop-42",
  "orderId": "order-99",
  "deliveredAt": "2026-11-10T10:03:00.000Z"
}
```

Acesta este evenimentul consumat ulterior de echipa W4 pentru decont.
