# Backend - starea livrarii

Serviciu TypeScript/Express pentru actualizarea starii opririlor de pe rutele
de livrare si sincronizarea evenimentelor acumulate offline in aplicatia
soferului.

## Rulare

```bash
npm install
npm test
npm start
```

Serverul porneste pe `http://localhost:3000`.

## Functionalitati

- `PATCH /route-stops/:id/status` valideaza tranzitiile unei opriri.
- `POST /route-stops/sync` aplica evenimentele offline in ordinea producerii.
- Evenimentele pentru opriri anulate sunt ignorate.
- Evenimentele duplicate sunt idempotente.
- Trecerea in `LIVRAT` publica un eveniment `DELIVERY_COMPLETED` pentru
  decontare.

Repository-ul folosit in aceasta versiune este in memorie, pentru ca
functionalitatea sa poata fi demonstrata fara configurarea unei baze de date.
Contractul de sincronizare este documentat in
[docs/route-stop-sync-contract.md](docs/route-stop-sync-contract.md).

