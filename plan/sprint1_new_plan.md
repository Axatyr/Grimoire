# Piano di Implementazione - Nuovo Sprint 1 (Grimoire)

Piano di implementazione dettagliato per soddisfare i 4 requisiti del nuovo **Sprint 1** definiti in `plan/toFix.md`.

---

## 1. Obiettivi dello Sprint 1

1. **Collegamenti Entità nei Nodi di Trama (Story Node Links)**:
   - Permettere al Master di collegare a ciascun nodo dello Story Tree qualsiasi entità della campagna: **Personaggi (PG)**, **NPC**, **Bestiario (Mostri)**, **Luoghi (Atlante)**, **Oggetti (Loot)** e **Quest**.
   - Risoluzione automatica dei dettagli delle entità collegate (nome, icona, tipo) e visualizzazione a schede/badge interattivi cliccabili.

2. **Ancoraggio Quest allo Story Path**:
   - Visualizzazione prominente delle Quest collegate ai nodi della storia con stato in tempo reale.
   - Possibilità di visualizzare la quest collegata anche dalla scheda del nodo e viceversa.

3. **Visibilità Nodi per i Giocatori (Fog of War Narrativa)**:
   - I **Giocatori** vedono unicamente i nodi **Raggiunti o Modificati** (`REACHED`, `ALTERED`), mantenendo segreti i nodi pianificati (`PLANNED`) e le diramazioni future del DM.
   - Gli archi/bivi visualizzati dai giocatori collegano solo nodi sbloccati.

4. **Condivisione Mirata Handout (Party Intero vs Singolo Giocatore)**:
   - Aggiornamento del sistema Socket.IO con room dedicate per singolo utente (`user:${userId}`).
   - Modale/selettore di condivisione su tutte le entità (Mostri, Quest, Note, Immagini, Nodi di storia) che consente al Master di scegliere:
     - 🌐 **Tutti i Giocatori (Party)**
     - 👤 **Singolo Giocatore specifico** (es. per lettere segrete, indizi individuali, visioni o sogni di un personaggio).
   - Notifica sul ricevente con indicazione chiara se l'handout è pubblico o un messaggio privato riservato (`🔒 Solo per te dal DM`).

---

## 2. Modifiche ai Componenti

### Backend Layer

#### [MODIFY] `backend/src/realtime/socketHandler.ts`
- Su `connection`: ogni socket si unisce alla room personale `user:${user.userId}` oltre che a `campaign:${campaignId}`.
- Nell'evento `live_broadcast`: supporta il parametro `targetUserId?: string`. Se presente, invia solo a `user:${targetUserId}`, altrimenti all'intera room `campaign:${campaignId}`.

#### [MODIFY] `backend/src/controllers/story.controller.ts`
- Nel `getStoryGraph`:
  - Se l'utente è un **Player**, filtra i nodi con `status: { in: ['REACHED', 'ALTERED'] }`.
  - Risolve i metadati delle entità collegate (`StoryNodeLink`) popolando nome, tipo e dettagli per renderli subito visualizzabili nel frontend.

---

### Frontend Layer

#### [MODIFY] `frontend/src/context/CampaignContext.tsx`
- Supporto a `broadcastHandout(type: string, payload: any, targetUserId?: string | null)`.
- Ricezione del flag `isPrivateToMe: boolean` e nome del destinatario in `LiveHandout`.

#### [NEW] `frontend/src/components/ShareModal.tsx`
- Modale riutilizzabile aperta al click di "Condividi" / "Mostra ai Giocatori" per selezionare:
  - Destinatario: "🌐 Tutti i Giocatori" oppure uno specifico membro del party.
  - Anteprima dell'oggetto trasmesso e pulsante di invio immediato.

#### [MODIFY] `frontend/src/components/HandoutBroadcastModal.tsx`
- Badge visivo per distinguere handout pubblici di gruppo da comunicazioni private al singolo giocatore.

#### [MODIFY] `frontend/src/components/StoryTree.tsx`
- Visualizzazione differenziata Master vs Giocatore (Fog of War narrativa per i player).
- Selettore entità collegate nella modale di creazione/modifica nodo (Personaggi, NPC, Mostri, Luoghi, Quest, Oggetti).
- Sezione dedicata alle **Quest ancorate** al nodo con badge di avanzamento.
- Integrazione di `ShareModal` per trasmettere situazioni della storia a tutto il party o a un singolo PG.

#### [MODIFY] Integrazione `ShareModal` su:
- `MonstersTab.tsx`
- `QuestsTab.tsx`
- `NotesTab.tsx`
- `GalleryTab.tsx`

---

## 3. Piano di Verifica e Collaudo

### Build & Compilazione
- `cd backend && npx tsc --noEmit`
- `cd frontend && npm run build`
