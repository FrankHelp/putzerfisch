Projekt-Spezifikation: Gamified Putz-App für WGs
Kontext & Zielgruppe

Web-App (PWA) für einen privaten Freundeskreis, keine öffentliche Nutzung. Kein Skalierungsdruck, Fokus auf einfache, robuste Umsetzung statt Over-Engineering. Als PWA installierbar (iPhone Homescreen, Desktop).

1. Auth & WG-System
Sign-up Flow:
Erster Nutzer registriert sich UND gründet dabei eine neue WG (WG-Name etc.).
Alle Nutzer sind gleichberechtigt Admins – keine Rollen-Hierarchie.
Invite-Link:
Jede WG hat einen dauerhaft gültigen Invite-Link (kein Ablauf, keine Einmalnutzung).
Wer über den Link kommt, tritt der WG direkt bei (kein Freigabeprozess nötig).
Beitrittsanfrage (alternativer Weg):
Nutzer ohne WG kann bestehende WGs durchstöbern (Liste/Suche) und eine Beitrittsanfrage senden.
Jedes Mitglied der Ziel-WG kann diese Anfrage annehmen/ablehnen (kein Admin-exklusives Recht).
Einschränkungen:
Ein Nutzer kann nur einer WG angehören.
Kein WG-Wechsel möglich.
Kein Konto-Löschen möglich.
➜ Agent: Bitte kurz nachfragen, ob es einen Ablehnungs-Grund/Text bei Beitrittsanfragen geben soll, und ob abgelehnte Nutzer erneut anfragen dürfen.
2. Aktivitäten-Katalog
Fix & zentral gepflegt (durch den Entwickler selbst, kein Nutzer-CRUD in v1).
Aktivitäten haben: Emoji, Titel, Kategorie (z. B. "Bad", "Küche", "Wohnzimmer", ...), Punktewert, kurze Beschreibung.
Punktevergabe-Logik: Punkte sollen sich an der voraussichtlich benötigten Zeit für die Aktivität orientieren (nicht willkürlich), um "Punkte-pro-Minute"-Farming einzelner Billig-Aktivitäten zu vermeiden.
➜ Agent: Bitte eine Beispiel-Punktetabelle für ~15-20 typische Aktivitäten vorschlagen (mit Zeitschätzung als Begründung), zur Abstimmung mit mir.
Darstellung: Card-Grid — Emoji + Titel + Punkte direkt sichtbar auf der Karte. Klick auf Karte öffnet Detail (Beschreibung + "Heute erledigt"-Button).
Suche
Fuzzy-Search (z. B. Fuse.js) über Titel + optionale Tags/Synonyme pro Aktivität (kein Vektor-DB-Overhead nötig für die Katalog-Größe).
Zusätzlich: Browsing nach Raum-/Kategorie-Filter.
➜ Agent: Bitte Tag/Synonym-Feld ins Datenmodell für Aktivitäten aufnehmen, damit Fuzzy-Search gut greift (z. B. "Klo" als Synonym zu "Toilette putzen").
Aktivitäts-Vorschläge (Community-Feature)
Eigener Reiter/Tab: Liste vorgeschlagener neuer Aktivitäten (Titel, Punkte-Vorschlag, Beschreibung).
Klick öffnet Detail; Daumen-hoch/-runter-Voting.
Sortierung nach Beliebtheit (Netto-Votes oder Upvotes).
Übernahme in den echten Katalog erfolgt manuell durch den Entwickler (kein automatisierter Merge).
3. Aktivität abschließen — Undo-Flow (kritisches UX-Detail)
Nutzer klickt "Heute erledigt" auf einer Aktivitäts-Karte.
Am unteren Bildschirmrand erscheint ein Toast/Snackbar für 4 Sekunden:
Text: "[Aktivität] abgeschlossen +[Punkte]"
Der eigene Punktezähler (falls sichtbar auf dem Screen) animiert nach oben.
Ein "Rückgängig"-Button ist im Toast enthalten.
Erst nach Ablauf der 4 Sekunden (ohne Undo-Klick) wird der Eintrag:
final in den Activity-Log geschrieben,
in den globalen Feed gepostet.
Danach ist der Eintrag nicht mehr löschbar (v1). Ein späteres Lösch-Feature ist denkbar, aber nicht Teil von v1.
➜ Agent: Bitte klären, ob der Punktestand server-seitig erst nach den 4 Sekunden final geschrieben wird, oder optimistisch sofort (mit Rollback bei Undo) — Empfehlung: serverseitig erst nach Ablauf committen, um Race Conditions zu vermeiden.
4. Feed (Reddit-artig, zentrales Feature)
Global sichtbar für alle Nutzer aller WGs (kein WG-internes Silo — bewusste Entscheidung, da reiner Freundeskreis).
Post-Typen im Feed:
Abgeschlossene Aktivitäten: "+15 Clemens hat 'Pfand wegbringen' abgeschlossen"
Badge-Freischaltungen: "🏆 Clemens hat den Badge 'Bad-Boss' freigeschaltet"
Reaktionen: Emoji-Reaktionen auf jeden Post.
Kommentare: Ausklappbar, können ebenfalls Fotos enthalten.
Fotos:
Client-seitige Kompression vor Upload: max. 1512px (längste Kante), Export als JPG.
Lokale Speicherung auf dem Server (kein externer Object-Storage-Dienst wie S3/Supabase Storage nötig — Speicherplatz ist ausreichend für den Nutzungsumfang).
➜ Agent: Bitte einen sinnvollen Ordnerstruktur-/Naming-Vorschlag für lokal gespeicherte Bilder machen (z. B. nach User-ID/Datum), inkl. Backup-Überlegung (auch wenn simpel).
5. Leaderboard
Zwei Zeiträume in v1:
Letzte 14 Tage (rolling window, prominent in der Main View)
All-Time
Umsetzung: created_at-Timestamp bei jedem Activity-Log-Eintrag speichern, Zeiträume dann als reine Query-Filter (kein separates Datenmodell nötig). Spätere Zeiträume (Woche/Monat) sind dadurch leicht nachrüstbar.
Individuelles Leaderboard: Alle Nutzer aller WGs, sortiert nach Punkten (14-Tage und All-Time getrennt).
WG-vs-WG-Vergleich: Durchschnittspunkte pro Mitglied (nicht Gesamtsumme, um unfairen Vorteil großer WGs zu vermeiden).
Zeitzone: Feste Server-Zeitzone Europe/Berlin für alle Datums-/Tagesgrenzen-Berechnungen (kein Pro-User-Zeitzone-Handling). Backend rechnet grundsätzlich mit Serverzeit.
Main-View-Layout (oben nach unten)
Leaderboard (14 Tage, ggf. Toggle zu All-Time)
Globaler Activity-Feed
6. Badges / Erfolge (v1: rein punktebasiert)
Ausschließlich Gesamtpunkte-Meilensteine als Trigger (z. B. 5 Punkte / erste Aktivität, 50, 100, ...).
Konkrete Badge-Liste/Werte werden später vom Auftraggeber selbst final definiert — v1 braucht nur Platzhalter-Beispiel-Badges und die technische Logik.
Trigger-Mechanik: Nach jedem finalen Activity-Log-Insert (also nach Ablauf des Undo-Fensters) prüfen, ob ein neuer Punkte-Schwellenwert erreicht wurde → falls ja, Badge vergeben + automatischer Feed-Post erzeugen.
➜ Agent: Bitte Badge-Logik so bauen, dass neue Schwellenwerte später einfach als Konfigurationsliste (nicht Code-Änderung) ergänzt werden können.
7. Notifications (Ausblick, nicht zwingend v1)
PWA Web Push ist gewünscht (z. B. bei Reaktionen auf eigene Posts, neue Beitrittsanfragen für die eigene WG).
Muss architektonisch mitgedacht werden (sauberes Event-Logging), muss aber nicht in der ersten Version implementiert sein.
➜ Agent: Bitte einschätzen/vorschlagen, ob Web Push gleich in v1 mitgebaut werden soll oder als klar abgegrenzter Nachbau-Schritt geplant wird.
8. Tech-Stack (Vorschlag, offen für Agenten-Input)
Frontend + Backend: Next.js (API-Routes, PWA-fähig)
DB: Postgres (z. B. via Supabase für Auth + DB, spart eigene Auth-Implementierung) — Hinweis: Datei-/Bild-Storage explizit NICHT über Supabase Storage, sondern lokal auf dem Server (siehe Punkt 4).
Suche: Fuse.js (Fuzzy-Search) statt Vektor-DB/Embeddings.
PWA: Installierbar auf iPhone-Homescreen und Desktop, inkl. Manifest + Service Worker.
➜ Agent: Bitte bei Bedarf alternative Vorschläge machen, falls Teile des Stacks für "lokale Bildspeicherung + eigenes Backend" ungünstig sind (z. B. falls Supabase-Hosting keinen persistenten lokalen Dateispeicher erlaubt — dann Alternative wie ein simpler VPS mit Docker vorschlagen).
9. Explizit NICHT Teil von v1
Kein WG-Wechsel, kein Konto-Löschen.
Kein automatisiertes Merging von Community-Aktivitätsvorschlägen.
Kein Lösch-Feature für bereits final gepostete Activity-Log-Einträge.
Kein externer Object-Storage für Bilder.
Kein WG-internes Feed-Silo (Feed ist global).
Keine Zeitzone-Individualisierung pro Nutzer.
Hinweis an den Agenten

Bitte an den markierten Stellen (➜) aktiv nachfragen bzw. Vorschläge machen, bevor größere Architekturentscheidungen final getroffen werden. Bei allen nicht explizit spezifizierten Detailfragen (z. B. genaues Styling, Fehlerbehandlung, Edge Cases) bitte sinnvolle, einfache Standardentscheidungen treffen und kurz benennen, statt Rückfragen zu häufen — Einfachheit hat Priorität vor Vollständigkeit, da es sich um ein privates Freundeskreis-Projekt handelt.
