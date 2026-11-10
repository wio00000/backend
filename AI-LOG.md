# AI-LOG

## 1. Cerinta primita

Am implementat partea repartizata pentru starea livrarii si sincronizarea cu
aplicatia soferului:

- `PATCH /route-stops/:id/status`;
- pachet de evenimente acumulat offline;
- aplicarea evenimentelor in ordinea producerii;
- conflictul in care dispecerul a anulat oprirea;
- emiterea evenimentului asteptat de echipa W4 la livrare.

## 2. Ce a fost gasit in repository

Repository-ul avea deja modelul `RouteStop`, regulile de tranzitie,
repository-ul in memorie si serviciul de actualizare a statusului. Nu exista
endpoint HTTP, sincronizare offline sau contract scris pentru evenimente.

## 3. Ce a fost implementat cu asistenta AI

- validarea statusurilor primite prin HTTP;
- serviciul `RouteStopService`;
- endpointul `PATCH /route-stops/:id/status`;
- endpointul `POST /route-stops/sync`;
- sortarea evenimentelor dupa `occurredAt`;
- idempotenta dupa `eventId`;
- pastrarea statusului `ANULAT`;
- publicarea evenimentului `DELIVERY_COMPLETED`;
- teste unitare pentru fluxurile principale;
- README, contract API si documentul de retrospectiva.

## 4. Decizii tehnice

Statusul `ANULAT` este terminal. Un eveniment venit ulterior de la sofer este
raportat ca ignorat si nu modifica oprirea.

Evenimentele sunt sortate dupa ora ISO 8601 `occurredAt`. Daca doua evenimente
au aceeasi ora, se pastreaza ordinea lor din pachet.

Publisher-ul este o interfata, iar implementarea curenta este in memorie.
Astfel, echipa W4 poate inlocui publisher-ul cu mecanismul propriu fara sa
schimbe regulile de business.

## 5. Validare

Au fost rulate:

```text
npm.cmd test
7 teste trecute, 0 esuate

npm.cmd run typecheck
fara erori TypeScript
```

## 6. Limite cunoscute

- repository-ul este in memorie si se pierde la repornirea procesului;
- nu exista autentificare sau autorizare;
- publisher-ul nu este conectat la un broker real;
- integrarea cu modelul complet de ruta si comanda se face ulterior.

## 7. Verificare umana necesara

Inainte de predarea finala, un membru al echipei trebuie sa confirme numele
evenimentului `DELIVERY_COMPLETED`, campurile sale si formatul orei cu echipa
W4 si cu persoana care integreaza aplicatia soferului.

