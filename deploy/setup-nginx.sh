#!/usr/bin/env bash
# Putzerfisch – einmalige nginx + Let's-Encrypt-Einrichtung (HTTPS).
#
# Aufruf auf dem Server (im Repo /opt/putzerfisch):
#   sudo bash deploy/setup-nginx.sh putz.deine-domain.de
#
# Voraussetzung: Der A-Record der Domain zeigt auf diese Server-IP.
# Das Skript ist idempotent – mehrfaches Ausführen schadet nicht.
set -euo pipefail

DOMAIN="${1:?Aufruf: sudo bash deploy/setup-nginx.sh <domain>}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN%/}"

cd "$(dirname "$0")/.."   # Repo-Root (nginx/-Confs finden)

echo "==> Domain: $DOMAIN"

# ---- Vorab-Check: löst die Domain auf? --------------------------------
IP=""
if command -v python3 >/dev/null 2>&1; then
  IP=$(python3 -c "import socket; print(socket.gethostbyname('$DOMAIN'))" 2>/dev/null || true)
fi
if [ -n "$IP" ]; then
  LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
  if [ -n "$LOCAL_IP" ] && [ "$IP" != "$LOCAL_IP" ]; then
    echo "   Hinweis: $DOMAIN -> $IP, Server hat $LOCAL_IP."
    echo "   Falls das nicht stimmt: A-Record auf die Server-IP zeigen lassen,"
    echo "   sonst schlägt die Let's-Encrypt-Challenge fehl."
  fi
else
  echo "   Hinweis: $DOMAIN löst gerade nicht auf – A-Record prüfen!"
fi

# ---- 1) nginx + certbot installieren -----------------------------------
echo "==> nginx + certbot installieren"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx certbot

# ---- 2) HTTP-Conf aktivieren (Challenge-Weg frei) -----------------------
echo "==> HTTP-Conf aktivieren"
cp nginx/putzerfisch-http.conf /etc/nginx/sites-available/putzerfisch
sed -i "s/putzapp\.example\.com/$DOMAIN/g" /etc/nginx/sites-available/putzerfisch
ln -sf /etc/nginx/sites-available/putzerfisch /etc/nginx/sites-enabled/putzerfisch
rm -f /etc/nginx/sites-enabled/default
mkdir -p /var/www/certbot
nginx -t
systemctl reload nginx

# ---- 3) Zertifikat erstellen (einmalig) ---------------------------------
echo "==> Let's-Encrypt-Zertifikat erstellen"
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN"
else
  echo "   Zertifikat existiert bereits – übersprungen."
fi

# ---- 4) Finale HTTPS-Conf aktivieren ------------------------------------
echo "==> HTTPS-Conf aktivieren"
cp nginx/putzerfisch.conf /etc/nginx/sites-available/putzerfisch
sed -i "s/putzapp\.example\.com/$DOMAIN/g" /etc/nginx/sites-available/putzerfisch
nginx -t
systemctl reload nginx

# ---- 5) Auto-Renewal: Timer + nginx-Reload-Hook -------------------------
echo "==> Auto-Renewal einrichten"
systemctl enable --now certbot.timer >/dev/null 2>&1 || true
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
printf '#!/bin/sh\nsystemctl reload nginx\n' > /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

# ---- 6) Test ------------------------------------------------------------
echo "==> Test"
if certbot renew --dry-run >/dev/null 2>&1; then
  echo "   Renewal-Dry-Run: OK"
else
  echo "   Renewal-Dry-Run: fehlgeschlagen (Details: sudo certbot renew --dry-run)"
fi
curl -fsS "https://$DOMAIN/api/health"
echo
echo "==> Fertig: https://$DOMAIN ist erreichbar."
