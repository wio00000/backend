# AI-LOG

## 1. Tool-ul folosit

Am folosit GitHub Copilot ca asistent AI în Visual Studio Code, prin Copilot
SDK. Pentru verificare am folosit terminalul local cu Node.js, npm, Git si
testele TypeScript ale proiectului.

## 2. Promptul de start (copy-paste)

```text
aceasta este sarcina de grup:
ECHIPA W3 — LOGISTICĂ ȘI RUTE
Bulimestru Gabriel (lead), Pîslari Andreea, Agachi Viorica, Botezatu Andrei

Agachi Viorica — backend, starea livrării și sincronizarea cu app-ul de șofer.
• PATCH /route-stops/:id/status — plecat, ajuns, livrat, refuzat, retur parțial.
• Endpoint de sincronizare: primește un pachet de evenimente acumulate offline,
  cu ora locală, și le aplică în ordinea în care s-au produs.
• Conflicte: dacă dispecerul a anulat oprirea între timp, evenimentul venit de
  la șofer nu o reînvie.
• La trecerea în livrată, emiți evenimentul pe care îl așteaptă echipa W4
  pentru decont.

Indică ce pot face individual, verifică ce există deja și continuă
implementarea pentru a finisa sarcina.
```

## 3. Cele mai importante trei prompturi

1. Cerința inițială pentru partea Agachi Viorica: statusuri, sincronizare
   offline, conflictul cu `ANULAT` si evenimentul pentru W4.
2. „Indică ce anume trebuie să fac pentru Viorica fără a mă conecta cu echipa
   pentru început și verifică ceea ce deja a fost realizat.”
3. Cerințele de predare: repository public, minimum 5 commit-uri, README,
   `AI-LOG.md`, `RETRO.md` si video de 60–90 de secunde.

## 4. Cerinta primita

Am implementat partea repartizata pentru starea livrarii si sincronizarea cu
aplicatia soferului:

- `PATCH /route-stops/:id/status`;
- pachet de evenimente acumulat offline;
- aplicarea evenimentelor in ordinea producerii;
- conflictul in care dispecerul a anulat oprirea;
- emiterea evenimentului asteptat de echipa W4 la livrare.

## 5. Ce a fost gasit in repository

Repository-ul avea deja modelul `RouteStop`, regulile de tranzitie,
repository-ul in memorie si serviciul de actualizare a statusului. Nu exista
endpoint HTTP, sincronizare offline sau contract scris pentru evenimente.

## 6. Ce a fost implementat cu asistenta AI

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

## 7. Decizii tehnice

Statusul `ANULAT` este terminal. Un eveniment venit ulterior de la sofer este
raportat ca ignorat si nu modifica oprirea.

Evenimentele sunt sortate dupa ora ISO 8601 `occurredAt`. Daca doua evenimente
au aceeasi ora, se pastreaza ordinea lor din pachet.

Publisher-ul este o interfata, iar implementarea curenta este in memorie.
Astfel, echipa W4 poate inlocui publisher-ul cu mecanismul propriu fara sa
schimbe regulile de business.

## 8. Validare

Au fost rulate:

```text
npm.cmd test
7 teste trecute, 0 esuate

npm.cmd run typecheck
fara erori TypeScript
```

## 9. Minimum trei greșeli ale AI-ului și cum au fost descoperite

1. AI-ul a presupus inițial că repository-ul era curat. Am verificat cu
   `git status` si am observat fisiere nemarcate, inclusiv raportul de practica.
2. AI-ul a rulat inițial `npm`, dar PowerShell a blocat `npm.ps1`. Mesajul
   `Execution policies` a aratat problema; am folosit apoi `npm.cmd`.
3. AI-ul a presupus formatul evenimentului pentru W4 fără confirmarea echipei.
   Verificarea contractului a aratat ca numele si campurile trebuie confirmate
   uman înainte de integrarea reală.
4. AI-ul a creat teste pentru serviciu, dar nu teste HTTP complete. Revizuirea
   suprafetei de testare a aratat limita; endpointurile trebuie testate ulterior
   cu un runner HTTP.

## 10. Ce am scris sau verificat personal fără AI

Am verificat manual repository-ul public pe GitHub, vizibilitatea fișierelor,
numărul de commit-uri si apariția contributorilor. Am decis personal să nu
includ `node_modules` si raportul de practică în commit-uri și am verificat
rezultatele testelor înainte de predare.

## 11. Ce aș face diferit în primele 10 minute

1. Aș verifica imediat `git status`, branch-ul și istoricul commit-urilor.
2. Aș citi `package.json` și toate testele existente înainte de implementare.
3. Aș fixa de la început formatul evenimentului W4 și al orei offline.
4. Aș adăuga imediat un test HTTP pentru fiecare endpoint.
5. Aș crea de la început README-ul, `.gitignore` și commit-uri mici.

## 12. Limite cunoscute

- repository-ul este in memorie si se pierde la repornirea procesului;
- nu exista autentificare sau autorizare;
- publisher-ul nu este conectat la un broker real;
- integrarea cu modelul complet de ruta si comanda se face ulterior.

## 13. Verificare umana necesara

Inainte de predarea finala, un membru al echipei trebuie sa confirme numele
evenimentului `DELIVERY_COMPLETED`, campurile sale si formatul orei cu echipa
W4 si cu persoana care integreaza aplicatia soferului.
