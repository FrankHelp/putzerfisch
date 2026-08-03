# 🐠 Putzerfisch

Eine gamifizierte Putz-App für WGs. Mobile-first, Unterwasser-Theme, echtes Multi-User-Backend.

Putzerfische halten im Riff alles sauber – genau das machen die Nutzer hier auch. Jede erledigte
Aufgabe bringt Punkte, Serien und Boni, alles landet in einem gemeinsamen Feed, auf den andere mit
Emojis reagieren und kommentieren können.

---

## Schnellstart

```bash
npm install          # installiert Server + Client (npm workspaces)
npm run seed:demo    # optional: Demo-WGs, Nutzer und Feed-Historie anlegen
npm run dev          # API auf :4321, Frontend auf :5173
```

Dann `http://localhost:5173` öffnen.

**Demo-Login:** `nala` / `putzen123` · **WG-Codes:** `RIFF23`, `LAGUNE`

> `npm run seed:demo` **leert die Datenbank** und legt sie neu an. Nur zum Ausprobieren nutzen.

### Auf dem Handy testen

Beide Geräte ins gleiche WLAN, dann die LAN-IP des Rechners aufrufen, z. B.
`http://192.168.1.42:5173`. Vite lauscht dank `host: true` bereits auf allen Interfaces.
Unter iOS/Android lässt sich die Seite über „Zum Home-Bildschirm“ als App installieren
(Manifest + Standalone-Modus sind eingerichtet).

### Produktivbetrieb

```bash
npm run build        # Frontend nach client/dist bauen
npm start            # ein Prozess auf :4321 liefert API + Frontend aus
```

Für einen echten Deploy unbedingt ein festes Token-Secret setzen, sonst wird eines generiert
und in der DB abgelegt:

```bash
PUTZAPP_SECRET=<langer-zufallsstring> PORT=8080 npm start
```

---

## Was drin ist

| Bereich | Details |
|---|---|
| **Login** | Registrierung mit Fisch-Avatar und Farbe, scrypt-Passworthashes, signierte Tokens (30 Tage) |
| **Feed** | Startseite mit allen Putzaktionen – umschaltbar zwischen eigener WG und allen Riffen |
| **Reaktionen** | 8 Emojis pro Eintrag, ein Tap zum An-/Abwählen, optimistisch dargestellt |
| **Kommentare** | Kommentieren, Kommentare upvoten, eigene löschen; sortiert nach Stimmen |
| **Aktivität eintragen** | Volltextsuche **oder** Auswahl über 9 Kategorien, danach Bestätigung mit Bonus-Vorschau |
| **Leaderboards** | WG-intern · WG-Liga (gemittelt pro Kopf) · global – je für Woche/Monat/gesamt |
| **WGs** | Gründen mit Wappen und Motto, Beitritt per 6-stelligem Code, Riff-Sauberkeits-Anzeige |
| **Vorschläge** | Neue Aktivitäten einreichen, abstimmen, ab 5 Stimmen automatisch im Katalog |
| **Profil** | Rang, Statistik, 14-Tage-Verlauf, Zonen-Verteilung, Abzeichen-Sammlung |

### Der Spiel-Teil

**Ränge** – 12 Stufen von *Planktonputzer* bis *Legende der Lagune*, jede mit eigenem Meerestier.

**Boni** werden bei jedem Eintrag transparent aufgeschlüsselt und multiplizieren die Basispunkte:

| Bonus | Bedingung | Effekt |
|---|---|---|
| 🔥 Serie | pro Tag am Stück | +5 %, max. +50 % |
| 🌅 Erster im Riff | erste WG-Aktion des Tages | +20 % |
| 🧭 Vergessene Zone | Kategorie seit 14 Tagen unberührt | +30 % |
| 🏖️ Wochenend-Krieger | Samstag oder Sonntag | +10 % |

Der „Vergessene Zone"-Bonus ist bewusst der stärkste: Er lenkt genau auf die Aufgaben, die in
WGs sonst ewig liegen bleiben.

**Riff-Sauberkeit** – ein Team-Wert von 0–100 %, der aus den Punkten der letzten 7 Tage geteilt
durch die Bewohnerzahl entsteht und ohne Aktivität von selbst absackt: *Kristallklar → Frisch →
Trüb → Algig → Sumpf*.

**15 Abzeichen**, u. a. Nachtschwärmer (nach 23 Uhr), Frühschwimmer (vor 7 Uhr), Allrounder
(alle 9 Zonen), Kachelkönig, Wal-Aktion (50+ Punkte auf einmal).

**Fairness in der WG-Liga** – gewertet werden Punkte *pro Kopf*, damit eine 2er-WG die gleiche
Chance hat wie eine 8er-WG. Intern zeigt die WG-Ansicht zusätzlich den „fairen Anteil“, also wie
viel jede Person bei Gleichverteilung beisteuern müsste.

---

## Aufbau

```
putzapp/
├── server/                 Express + SQLite (node:sqlite, keine nativen Module)
│   ├── index.js            Einstiegspunkt, Routen-Montage, liefert im Prod-Modus client/dist
│   ├── db.js               Schema + Katalog-Seed (idempotent)
│   ├── catalog.js          9 Kategorien, ~65 Putzaktivitäten
│   ├── game.js             Ränge, Boni, Streaks, Abzeichen, Riff-Sauberkeit
│   ├── auth.js             scrypt-Hashing, HMAC-signierte Tokens, Middleware
│   ├── seedDemo.js         Demo-Datensatz
│   └── routes/             auth · activities · feed · leaderboard · wg · suggestions · users
└── client/                 React 19 + Vite
    ├── src/router.jsx      Hash-Router in ~30 Zeilen (Zurück-Button funktioniert)
    ├── src/state.jsx       Auth-Context + Toasts
    ├── src/styles.css      Design-System: Tiefsee-Glas, Blasen, Lichtstrahlen
    ├── src/components/     ui.jsx (Avatar, Sheet, Konfetti …) · FeedCard.jsx
    └── src/pages/          Login · Feed · Add · Board · Ideas · Profile · WG
```

Die Datenbank liegt als `server/putzapp.db` daneben und wird beim ersten Start selbst angelegt.
Verschieben lässt sie sich per `PUTZAPP_DB=/pfad/zur.db`.

**Keine externen Dienste.** Kein Docker, keine Migrations-CLI, keine nativen Build-Tools –
`node:sqlite` ist seit Node 22.5 eingebaut. Voraussetzung ist entsprechend Node ≥ 22.5.

### Konfiguration

| Variable | Standard | Zweck |
|---|---|---|
| `PORT` | `4321` | Port der API |
| `PUTZAPP_SECRET` | generiert | Signier-Secret für Tokens |
| `PUTZAPP_DB` | `server/putzapp.db` | Pfad zur Datenbank |
| `PUTZAPP_APPROVE_VOTES` | `5` | Stimmen, bis ein Vorschlag in den Katalog wandert |

---

## Wenn es weitergehen soll

Ein paar Dinge sind bewusst nicht drin, weil sie erst bei echtem Betrieb relevant werden:

- **Rate Limiting** auf `/api/auth/*` – aktuell kann man Passwörter unbegrenzt durchprobieren.
  Bei einem Deploy ins offene Netz das zuerst nachrüsten.
- **Bilder** zu Putzaktionen (Vorher/Nachher wäre für den Feed naheliegend).
- **Push-Benachrichtigungen**, wenn jemand reagiert oder das Riff verschlammt.
- **Wiederkehrende Aufgaben** mit Fälligkeitsdatum – der Datenbestand gibt das schon her.
- **Saisons**: Leaderboard-Reset alle 3 Monate mit Trophäen-Archiv.
