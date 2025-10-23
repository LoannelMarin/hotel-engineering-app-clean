#!/bin/bash
# ============================================================
# ³œí ¾í DEPLOY FRONTEND REACT - ENGINEERING.GETSNOVA.COM
# ============================================================

FRONT_DIR="/var/www/hotel-engineering-frontend"
DOMAIN_NAME="engineering.getsnova.com"
GIT_REPO="https://github.com/LoannelMarin/hotel-engineering-app-clean.git"
EMAIL_CERT="alejandropepper.almp@gmail.com" 

echo "=============================================="
echo "·±í ½í Iniciando despliegue de FRONTEND React para $DOMAIN_NAME"
echo "=============================================="

# ------------------------------------------------------------
# 1º€ï¸âƒ£ Instalar dependencias
# ------------------------------------------------------------
sudo apt update -y && sudo apt install -y git nginx nodejs npm curl certbot python3-certbot-nginx

# ------------------------------------------------------------
# 2ï¸âƒ£ Clonar o actualizar frontend
# ------------------------------------------------------------
if [ ! -d "$FRONT_DIR" ]; then
  echo "í ½í Clonando repositorio..."
  sudo git clone $GIT_REPO $FRONT_DIR
else
  echo "³¦âš™ï¸ Actualizando frontend existente..."
  cd $FRONT_DIR && sudo git pull origin main
fi

# ------------------------------------------------------------
# 3ï¸âƒ£ Compilar frontend React (asumiendo carpeta /frontend)
# ------------------------------------------------------------
cd $FRONT_DIR/frontend || mkdir -p $FRONT_DIR/frontend && cd $FRONT_DIR/frontend
sudo npm install -g npm@latest
sudo npm install
sudo npm run build

# ------------------------------------------------------------
# 4ï¸âƒ£ Configurar Nginx
# ------------------------------------------------------------
NGINX_CONF="/etc/nginx/sites-available/frontend-engineering.conf"

sudo bash -c "cat > ${NGINX_CONF}" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    root ${FRONT_DIR}/frontend/dist;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }
}
NGINX

sudo ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# ------------------------------------------------------------
# 5ï¸âƒ£ Generar certificado SSL (Certbot)
# ------------------------------------------------------------
sudo certbot --nginx -d ${DOMAIN_NAME} --non-interactive --agree-tos -m ${EMAIL_CERT} --redirect

# ------------------------------------------------------------
# 6ï¸âƒ£ Limpiar y mostrar estado
# ------------------------------------------------------------
sudo systemctl restart nginx

echo "=============================================="
echo "âœ… FRONTEND DEPLOY COMPLETO"
echo "í ½í URL: https://${DOMAIN_NAME}"
echo "´—í ½í Carpeta: ${FRONT_DIR}/frontend/dist"
echo "=============================================="
