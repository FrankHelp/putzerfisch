# Putzerfisch – Server-Setup & Deployment

Ziel: Die App läuft auf einem Linux-Server (getestet mit Ubuntu 22.04/24.04) in
einem Docker-Container. nginx auf dem Host terminiert HTTPS (Let's Encrypt) und
leitet an den Container weiter. GitHub Actions deployed per SSH.

```
Internet ──> nginx (Host, Port 80/443, Let's Encrypt)
                 └──> http://127.0.0.1:4321  ──> Docker-Container (putzapp)
                                                     ├── DB:      /opt/putzerfisch/data/putzapp.db
                                                     └── Uploads: /opt/putzerfisch/data/uploads/
```

Voraussetzungen
- Server mit Ubuntu 22.04 oder 24.04, root-Zugriff per SSH
- Eine Domain (z. B. `putz.deine-domain.de`), deren A-Record auf die Server-IP zeigt
- GitHub-Repo `FrankHelp/putzerfisch` (privat)

---

## 1. Docker auf dem Server installieren

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# neu einloggen (oder: newgrp docker), damit die Gruppe greift
docker --version
```

## 2. Projekt auf den Server holen

Privates Repo -> der Server braucht einen Deploy-Key:

```bash
# auf dem Server:
ssh-keygen -t ed25519 -f ~/.ssh/putzerfisch_deploy -N "" -C "putzerfisch-deploy"
cat ~/.ssh/putzerfisch_deploy.pub
```

Den Public Key in GitHub eintragen:
Repo -> Settings -> Deploy keys -> Add deploy key
(Paste, Read access reicht – der Server muss nur pullen.)

```bash
sudo mkdir -p /opt/putzerfisch
sudo chown $USER /opt/putzerfisch
cd /opt/putzerfisch
git clone git@github.com:FrankHelp/putzerfisch.git .
```

## 3. Umgebung anlegen (.env)

```bash
cd /opt/putzerfisch
cp .env.example .env
nano .env        # PUTZAPP_SECRET durch openssl rand -hex 32 ersetzen
```

Ohne Secret generiert die App selbst eines und legt es in der DB ab – das
überlebt Deploys, weil die DB persistent ist. Explizit setzen ist trotzdem
empfohlen.

### 3a. Push-Benachrichtigungen aktivieren (optional, empfohlen)

Damit die Riffpost auch als Push-Benachrichtigung am Handy ankommt (iOS:
App zum Homescreen hinzufügen, iOS 16.4+), braucht der Server ein VAPID-
Schlüsselpaar. Einmalig erzeugen und in `.env` eintragen:

```bash
npx web-push generate-vapid-keys --json
# Ausgabe z. B.:
# { "publicKey": "BEl...", "privateKey": "q1x..." }
```

Dann in der `.env` (gleiche Zeilen wie in `.env.example`):

```
VAPID_PUBLIC_KEY=BEl...
VAPID_PRIVATE_KEY=q1x...
VAPID_SUBJECT=mailto:deine@email.de
```

Die Schlüssel bleiben dauerhaft gültig – einmal eingetragen, nie wieder
ändern (sonst verlieren alle Handys ihre Push-Abos). Danach neu deployen
bzw. `docker compose up -d --build`.

## 4. App starten (erster Lauf)

```bash
mkdir -p data
docker compose up -d --build
curl http://127.0.0.1:4321/api/health   # -> {"ok":true}
docker compose logs -f                  # erste Ausgaben ansehen
```

Die App ist jetzt nur lokal (127.0.0.1:4321) erreichbar – nach außen geht es
erst über nginx.

## 5. HTTPS mit nginx + Let's Encrypt

Voraussetzung: Der A-Record der Domain zeigt auf die Server-IP.

**Einfachster Weg – Setup-Skript** (installiert nginx + certbot, erstellt das
Zertifikat, aktiviert HTTPS, richtet Auto-Renewal ein):

```bash
cd /opt/putzerfisch && git pull          # holt deploy/setup-nginx.sh
sudo bash deploy/setup-nginx.sh putz.deine-domain.de
```

**Von Hand** (was das Skript tut):

```bash
sudo apt update && sudo apt install -y nginx certbot

# A – HTTP-Config aktivieren (damit certbot die Challenge beantworten kann):
sudo cp nginx/putzerfisch-http.conf /etc/nginx/sites-available/putzerfisch
sudo nano /etc/nginx/sites-available/putzerfisch   # putzapp.example.com -> DEINE Domain
sudo ln -s /etc/nginx/sites-available/putzerfisch /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default            # Default-Site weg
sudo mkdir -p /var/www/certbot
sudo nginx -t && sudo systemctl reload nginx

# B – Zertifikat erstellen (webroot-Methode, erneuert sich automatisch):
sudo certbot certonly --webroot -w /var/www/certbot -d putz.deine-domain.de

# C – HTTPS-Config aktivieren:
sudo cp nginx/putzerfisch.conf /etc/nginx/sites-available/putzerfisch
sudo nano /etc/nginx/sites-available/putzerfisch   # Domain ersetzen (2x im 443-Block)
sudo nginx -t && sudo systemctl reload nginx

# D – nginx nach jedem Renewal neu laden lassen:
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh >/dev/null <<'EOF'
#!/bin/sh
systemctl reload nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
```

Das Renewal übernimmt der systemd-Timer `certbot.timer` (läuft ab Installation
automatisch). Test: `sudo certbot renew --dry-run`

Fertig – https://putz.deine-domain.de sollte die App zeigen.

## 6. GitHub Actions: SSH-Deploy einrichten

Schlüssel für den Deploy erzeugen (auf deinem Rechner, nicht auf dem Server):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/putzerfisch_gh -N "" -C "github-actions"
cat ~/.ssh/putzerfisch_gh.pub
```

Public Key auf dem Server erlauben:

```bash
# auf dem Server:
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA... github-actions" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Damit der Deploy-Key beim `git pull` nicht im Weg ist: `~/.ssh/config` auf dem
Server anlegen:

```
Host github.com
  IdentityFile ~/.ssh/putzerfisch_deploy
  IdentitiesOnly yes
```

Secrets im GitHub-Repo anlegen (Settings -> Secrets and variables -> Actions):

| Secret           | Wert                                                        |
|------------------|-------------------------------------------------------------|
| `SERVER_HOST`    | IP oder Hostname des Servers                                |
| `SERVER_USER`    | SSH-Benutzer (der, der /opt/putzerfisch besitzt)            |
| `SERVER_SSH_KEY` | Inhalt von `~/.ssh/putzerfisch_gh` (privater Key, komplett) |

Optional `SERVER_PORT`, falls SSH nicht auf 22 läuft.

## 7. Deployen

- Automatisch: jeder Push auf `main` startet den Workflow
- Manuell: GitHub -> Actions -> Deploy -> "Run workflow"

Was passiert (siehe `deploy/deploy.sh`):
1. `git pull` auf dem Server
2. Docker-Image bauen + Container neu starten
3. Healthcheck auf `/api/health` (bis 60 s)
4. Bei Fehler: automatisches Rollback auf das vorherige Image

Status im Actions-Tab ansehen; Fehler dort schlagen rot an.

---

## Backup

DB + Uploads liegen komplett unter `/opt/putzerfisch/data` – Backup = Kopie:

```bash
tar czf putzapp-backup-$(date +%F).tar.gz /opt/putzerfisch/data
```

## Troubleshooting

| Problem | Lösung |
|---|---|
| `docker compose up` schlägt fehl: Port 4321 belegt | `docker ps` prüfen – läuft schon ein alter Container? `docker compose down` |
| nginx startet nicht nach Schritt C | Zertifikat fehlt: `ls /etc/letsencrypt/live/` prüfen, Domain in der conf mit `certbot certificates` abgleichen |
| Healthcheck im Deploy schlägt fehl | `docker compose logs app` auf dem Server ansehen |
| SSE/Muschel aktualisiert nicht | `proxy_buffering off`-Block prüfen (nginx/putzerfisch.conf) |
| Tokens nach Deploy ungültig | `PUTZAPP_SECRET` in `.env` fehlt/ändert sich – siehe Schritt 3 |
| Push-Button meldet „VAPID fehlt“ | `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` in `.env` setzen (Schritt 3a) und neu deployen |
| Keine Push auf dem iPhone | App muss zum Homescreen hinzugefügt sein (iOS 16.4+); Berechtigung unter Einstellungen → „Putzerfisch“ → Benachrichtigungen prüfen |
