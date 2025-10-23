#!/bin/bash
# ============================================================
# í ¼í HOTEL ENGINEERING APP CLEAN DEPLOYMENT - FULL AUTO
# ============================================================

APP_NAME="hotel-engineering"
APP_DIR="/home/ubuntu/hotel-engineering-app"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
PYTHON_VERSION="python3.10"
DOMAIN_NAME="api.getsnova.com"
API_PORT=5000
IP_LOCAL="127.0.0.1"

echo "=============================================="
echo "¼í ½í Iniciando despliegue automº€tico de $APP_NAME"
echo "=============================================="

sudo apt update -y && sudo apt upgrade -y
sudo apt install -y git nginx ${PYTHON_VERSION}-venv ${PYTHON_VERSION}-dev build-essential curl ufw

cd /home/ubuntu
if [ ! -d "$APP_DIR" ]; then
  echo "Ã¡í ½í Clonando repositorio desde GitHub..."
  git clone https://github.com/LoannelMarin/hotel-engineering-app-clean.git hotel-engineering-app
else
  echo "³¦âš™ï¸ Repositorio existente, actualizando..."
  cd $APP_DIR && git pull origin main
fi

cd $APP_DIR/backend || mkdir -p $APP_DIR/backend && cd $APP_DIR/backend
${PYTHON_VERSION} -m venv venv
source venv/bin/activate

cat > requirements.txt <<REQS
flask
flask-cors
flask-jwt-extended
flask-sqlalchemy
gunicorn
REQS

pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f "app.py" ]; then
  cat > app.py <<APP
from flask import Flask, jsonify
def create_app():
    app = Flask(__name__)
    @app.route('/')
    def home():
        return jsonify({"status": "running", "app": "Hotel Engineering API"})
    return app
if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=${API_PORT})
APP
fi

sudo bash -c "cat > ${SERVICE_FILE}" <<SERVICE
[Unit]
Description=Hotel Engineering Flask API
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=${APP_DIR}/backend
Environment="PATH=${APP_DIR}/backend/venv/bin"
ExecStart=${APP_DIR}/backend/venv/bin/gunicorn --workers 3 --bind ${IP_LOCAL}:${API_PORT} app:create_app()

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable ${APP_NAME}.service
sudo systemctl restart ${APP_NAME}.service

NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}.conf"
sudo bash -c "cat > ${NGINX_CONF}" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    location / {
        proxy_pass http://${IP_LOCAL}:${API_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

sudo ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "=============================================="
echo "âœ… Despliegue completado correctamente"
echo "í ½í API disponible en: http://${DOMAIN_NAME}"
echo "´—í ½í Logs en tiempo real: sudo journalctl -u ${APP_NAME} -f"
echo "=============================================="
