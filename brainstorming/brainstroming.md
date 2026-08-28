Scopo dell'app:
Avere una base di dati, esporla su un server locale, e avere interfaccie web per player e master.
Deve permettere di gestire più campagne, e per ogni campagna deve consentire di condividere informazioni fra master e player.

Core:
- Database
- Master
- Player

Aspetti tecnici:
- Database su docker i sql
- Server da esporre in locale che sia raggiungibile dall'esterno
- Interfaccia web per master e player
- Api da invocare per gestire be e fe
- Autenticazione semplice per tenere traccia dei personaggi (quindi utente, password e personaggi/campagne associate all'utente)
- Interfacce sia desktop che mobile
- Creare classi base per gestire informazioni comuni es. date create/modificate/eliminare, etichette.


Gestione immagini:
- Caricamento dell'immagine tramite web interface
- Link del sito da dove viene presa (visualizzazione diretta senza download su db)
// TODO: Definire quali elementi possono essere caricati

Funzionalità:
1. Master tools (web app, access by master)
- Create/Edit/Delete Campaign
- Create/Edit/Delete characters
- Assign characters to campaigns
- Assign characters to players
- Create/Edit/Delete monsters
- Create/Edit/Delete items
- Create/Edit/Delete locations
- Create/Edit/Delete quests
- Create/Edit/Delete NPCs
- Create/Edit/Delete events
- Create/Edit/Delete notes
- Create/Edit/Delete logs
- Create/Edit/Delete images

2. Player tools (web app, access by player)
- View characters
- View campaigns
- View monsters
- View items
- View locations
- View quests
- View NPCs
- View events
- View notes
- View logs
- View images
- Create/Edit/Delete characters
- Create/Edit/Delete monsters
- Create/Edit/Delete items
- Create/Edit/Delete locations
- Create/Edit/Delete quests
- Create/Edit/Delete NPCs
- Create/Edit/Delete events
- Create/Edit/Delete notes
- Create/Edit/Delete logs
- Create/Edit/Delete images

3. API (REST)
- GET /campaigns
- POST /campaigns
- GET /campaigns/:id
- PUT /campaigns/:id
- DELETE /campaigns/:id
- GET /characters
- POST /characters
- GET /characters/:id
- PUT /characters/:id
- DELETE /characters/:id
- GET /monsters
- POST /monsters
- GET /monsters/:id
- PUT /monsters/:id
- DELETE /monsters/:id
- GET /items
- POST /items
- GET /items/:id
- PUT /items/:id
- DELETE /items/:id
- GET /locations
- POST /locations
- GET /locations/:id
- PUT /locations/:id
- DELETE /locations/:id
- GET /quests
- POST /quests
- GET /quests/:id
- PUT /quests/:id
- DELETE /quests/:id
- GET /npcs
- POST /npcs
- GET /npcs/:id
- PUT /npcs/:id
- DELETE /npcs/:id
- GET /events
- POST /events
- GET /events/:id
- PUT /events/:id
- DELETE /events/:id
- GET /notes
- POST /notes
- GET /notes/:id
- PUT /notes/:id
- DELETE /notes/:id
- GET /logs
- POST /logs
- GET /logs/:id
- PUT /logs/:id
- DELETE /logs/:id
- GET /images
- POST /images
- GET /images/:id
- PUT /images/:id
- DELETE /images/:id

Funzionalità core del Master:
- Gestire informazioni in modo che siano facilmente reperibili, immagina di avere un albero decisionale dove, in base alla scelta fatta siano a disposizioni le informazioni associate. Queste possono essere viste come dei link, quindi mi immagino un "path" per la campagna che viene via via aggiornato come preparazione per giocare l'avventura, e poi quando viene giocata questa può essere confermata o modificata. La stessa al termine deve comprendere un riassunto che diventi un punto di partenza per la prossima avventura. All'interno di questo path o flows se vogliamo chiamarlo così, ci possono essere dei link ad altri elementi, quindi la gestione del master deve permettere di creare un albero decisionale complesso e ben organizzato. Tutti i link devono essere cliccabili e devono permettere di navigare all'interno della campagna, modificando e aggiungendo elementi.

Funzionalità trasversale:
- Deve essere possibile, una volta ottenuto un loot, di assegnarlo direttamente ai giocatori. Il master lo può vedere e assegnandolo al giocatore questo viene aggiunto al personaggio del giocatore. Il giocatore potrà a sua volta vederlo e scegliere se tenerlo, darlo ad altri personaggi o buttarlo.
- Informazioni condivisibili facilmente fra master e giocatori: note di testo, immagini, quest(scritta).

Prima versione
- Avere un Database completo
- Permettere input di tutte le info necessarie 
- Board del Master minimale
- Board dei giocatori minimale
