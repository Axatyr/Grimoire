# 📖 Grimoire

> **Grimoire** è una piattaforma web moderna, reattiva e self-hosted per Dungeon Master e Giocatori di Ruolo (D&D 5e e altri TTRPG). Permette di gestire campagne, bivi narrativi interattivi (Story Tree), bestiario, loot distribution in tempo reale, schede eroi, atlante e trasmissione istantanea di handout.

---

## 🛠️ Requisiti di Sistema

Assicurati di avere installato sulla tua macchina:
- **Node.js** (v18 o superiore) & **npm**
- **Docker** & **Docker Compose** (per il database PostgreSQL)

---

## 🚀 Guida Rapida all'Avvio

### 1. Avviare il Database PostgreSQL (Docker)
Dalla radice del progetto:

```bash
docker compose up -d
```
> Il database PostgreSQL sarà attivo in background sulla porta **`5432`** con volume persistente.

---

### 2. Configurare ed Avviare il Backend (API & WebSocket)

1. Spostati nella cartella `backend`:
   ```bash
   cd backend
   ```

2. Installa le dipendenze (se non già fatto):
   ```bash
   npm install
   ```

3. Verifica il file `.env` (è già configurato per connettersi a PostgreSQL locale su porta 5432 e avviare il server su porta 4000).

4. Sincronizza lo schema Prisma con il database:
   ```bash
   npx prisma db push
   ```

5. Avvia il server backend in modalità sviluppo:
   ```bash
   npm run dev
   ```
> Il backend sarà in ascolto su **`http://localhost:4000`** (con WebSocket attivi per la sincronizzazione in tempo reale).

---

### 3. Configurare ed Avviare il Frontend (Web App)

1. Apri un **nuovo terminale** e spostati nella cartella `frontend`:
   ```bash
   cd frontend
   ```

2. Installa le dipendenze (se non già fatto):
   ```bash
   npm install
   ```

3. Avvia l'applicazione Vite:
   ```bash
   npm run dev
   ```
> L'applicazione sarà accessibile nel browser all'indirizzo **`http://localhost:5173`**.

---

## 🧭 Panoramica delle Porte

| Servizio | URL / Porta | Descrizione |
|---|---|---|
| **Database PostgreSQL** | `localhost:5432` | Storage relazionale gestito da Docker |
| **Backend Server** | `http://localhost:4000` | Express REST API + Socket.IO Realtime |
| **Frontend Web App** | `http://localhost:5173` | Interfaccia utente interattiva (React + Vite) |

---

## 🧙‍♂️ Funzionalità Principali

- **Ruoli Separati (Master vs Giocatori)**:
  - Il **Dungeon Master** può creare campagne, preparare bivi narrativi, gestire il **Forziere Segreto (DM Stash)** con gruppi di loot, nascondere/mostrare entità e modificare qualsiasi elemento.
  - I **Giocatori** possono partecipare a campagne esistenti, gestire la propria scheda, scambiare oggetti nel party in tempo reale e consultare il diario e il bestiario sbloccato.
- **Story Decision Tree**: Mappa visiva dei bivi narrativi della trama con tracciamento delle scelte fatte dal party.
- **Proprietà Custom & Segretezza**: Proprietà dinamiche chiave-valore con flag `[🔒 DM]` per informazioni visibili solo al Master.
- **Live Handout Broadcast**: Trasmissione istantanea su schermo di pergamene, mostri, quest e immagini a tutti i giocatori connessi via WebSocket.
- **Atlante Gerarchico**: Mappe e luoghi con gestione intelligente e svincolo dei sotto-luoghi alla cancellazione.
