# Piano di Implementazione - Sprint 1 (Grimoire)

Piano di implementazione per soddisfare tutti i requisiti dello **Sprint 1** definiti in `plan/toFix.md`.

---

## 1. Obiettivi dello Sprint 1

1. **Proprietà Customizzabili con Visibilità Master/Player**:
   - Aggiungere supporto a proprietà dinamiche chiave-valore con flag `isSecret` (visibile solo al DM o anche ai giocatori) su Personaggi, Mostri, Oggetti, NPC, Luoghi e Quest.
   - Sanitizzazione lato Backend per filtrare automaticamente i campi segreti se la richiesta proviene da un giocatore.

2. **Modifica Completa (Edit) di Tutte le Entità per il Master**:
   - Form e modali di modifica (Edit) per: Personaggi, Bestiario, Oggetti/Loot, Luoghi, NPC, Quest, Note.

3. **Cancellazione Intelligente Luoghi con Notifica Svincolo Figli**:
   - Quando si cancella un luogo che ha sotto-luoghi (figli), il backend svincola automaticamente i riferimenti (`parentId = null`) e il frontend mostra un avviso esplicativo preventivo.

4. **Visibilità Granulare (Pubblico / Segreto del Master)**:
   - Toggle di visibilità (`PUBLIC_PLAYERS` vs `PRIVATE_MASTER`) su ogni entità con badge e controlli immediati.

5. **Ristrutturazione Inventario & Forziere del DM (DM Stash / Loot Bundles)**:
   - Gestione dedicata del **Forziere Segreto del DM**: dove il Master prepara loot e tesori prima che i giocatori li scoprano.
   - Raggruppamento del loot in pacchetti/forzieri (es. *"Tesoro della Cripta"*, *"Bottino dei Banditi"*).
   - Possibilità con un click di rendere un intero bottino visibile ai giocatori o assegnarlo direttamente.

---

## 2. Modifiche ai Componenti

### Backend Layer

#### [MODIFY] [`backend/prisma/schema.prisma`](file:///Users/alessandro/Sources/Grimoire/backend/prisma/schema.prisma)
- Aggiunta campo `customProperties Json?` su `Character`, `Monster`, `Item`, `Location`, `NPC`, `Quest`, `Note`.
- Aggiunta campo `lootGroup String?` su `Item` per raggruppamento forzieri/loot.

#### [MODIFY] [`backend/src/utils/sanitize.ts`](file:///Users/alessandro/Sources/Grimoire/backend/src/utils/sanitize.ts) [NEW]
- Helper riutilizzabile per filtrare `customProperties`: se l'utente non è Master, rimuove tutte le proprietà con `isSecret: true`.

#### [MODIFY] [`backend/src/controllers/location.controller.ts`](file:///Users/alessandro/Sources/Grimoire/backend/src/controllers/location.controller.ts)
- Nel `deleteLocation`: svincola i figli (`updateMany({ where: { parentId: id }, data: { parentId: null } })`) e restituisce il numero di luoghi svincolati.

#### [MODIFY] [`backend/src/controllers/item.controller.ts`](file:///Users/alessandro/Sources/Grimoire/backend/src/controllers/item.controller.ts)
- Supporto a `lootGroup`, visibilità segreta/pubblica del loot, e batch transfer.

#### [MODIFY] Controller delle altre entità:
- `character.controller.ts`, `monster.controller.ts`, `npc.controller.ts`, `quest.controller.ts`, `note.controller.ts`: integrazione salvataggio/update di `customProperties` e filtraggio visibilità.

---

### Frontend Layer

#### [NEW] [`frontend/src/components/CustomPropertiesEditor.tsx`](file:///Users/alessandro/Sources/Grimoire/frontend/src/components/CustomPropertiesEditor.tsx)
- Componente riutilizzabile per aggiungere, modificare ed eliminare proprietà personalizzate con toggle `[🔒 Solo Master]`.

#### [MODIFY] [`frontend/src/components/CharactersTab.tsx`](file:///Users/alessandro/Sources/Grimoire/frontend/src/components/CharactersTab.tsx)
- Aggiunta modale di **Modifica Personaggio**.
- Integrazione proprietà personalizzate e toggle visibilità.

#### [MODIFY] [`frontend/src/components/MonstersTab.tsx`](file:///Users/alessandro/Sources/Grimoire/frontend/src/components/MonstersTab.tsx)
- Aggiunta modale di **Modifica Mostro**.
- Toggle visibilità (visibile/nascosto ai player) e proprietà custom.

#### [MODIFY] [`frontend/src/components/InventoryTab.tsx`](file:///Users/alessandro/Sources/Grimoire/frontend/src/components/InventoryTab.tsx)
- Riorganizzazione in 3 sezioni:
  1. **Inventario Party**: oggetti posseduti dai personaggi.
  2. **Bottino Rivelato (Party Loot)**: oggetti liberi visibili a tutti i giocatori.
  3. **🔒 Forziere del DM (DM Stash)**: bottini e oggetti preparati dal Master, raggruppati per forziere (es. *Tesoro dei Goblin*) con pulsante rapido *"Rivela ai Giocatori"*.
- Modale di Modifica Oggetto.

#### [MODIFY] [`frontend/src/components/LocationsTab.tsx`](file:///Users/alessandro/Sources/Grimoire/frontend/src/components/LocationsTab.tsx)
- Modale di **Modifica Luogo**.
- Avviso informativo con dialogo di conferma prima della cancellazione di un luogo con sotto-luoghi collegati.

#### [MODIFY] [`frontend/src/components/NpcsTab.tsx`](file:///Users/alessandro/Sources/Grimoire/frontend/src/components/NpcsTab.tsx)
- Modale di **Modifica NPC**.
- Visualizzazione/editing proprietà custom e visibilità pubblica/segreta.

#### [MODIFY] [`frontend/src/components/QuestsTab.tsx`](file:///Users/alessandro/Sources/Grimoire/frontend/src/components/QuestsTab.tsx)
- Modale di **Modifica Quest**.
- Gestione proprietà custom e visibilità.

---

## 3. Piano di Verifica e Collaudo

### Test Automatici & Build
1. Esecuzione `npx prisma db push` per allineare il database PostgreSQL.
2. Verifica compilazione TypeScript backend: `cd backend && npx tsc --noEmit`.
3. Verifica bundle frontend: `cd frontend && npm run build`.

### Test Manuali
1. **Proprietà Custom**: Creazione di un'entità con proprietà pubblica e proprietà segreta (es. *"Debolezza segreta"*). Verifica che con login da giocatore la proprietà segreta non sia visibile.
2. **Modifica Entità**: Modificare nome, statistiche e visibilità di un mostro/luogo/npc/oggetto e verificare il salvataggio immediato.
3. **Cancellazione Luogo Padre**: Cancellare una regione contenente una città; verificare che la città rimanga intatta e venga promossa a luogo indipendente con messaggio di notifica.
4. **DM Stash & Loot**: Creare un forziere segreto nel DM Stash, aggiungere 3 oggetti con un `lootGroup`, verificare che i player non lo vedano, cliccare "Rivela ai Giocatori" e verificare la comparsa in tempo reale nell'inventario condiviso.
