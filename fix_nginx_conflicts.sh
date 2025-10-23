#!/bin/bash
# =============================================================
# ≥¶Ì†æÌ LIMPIEZA AUTOM∑πTICA DE NGINX + VERIFICACI√Å√ìN DE DOMINIOS
# =============================================================

echo "=============================================="
echo "Ì†æÌ Limpiando duplicados y conflictos de Nginx..."
echo "=============================================="

# ∑πÌ†ΩÌ Mostrar configuraciones actuales
echo "Archivos en /etc/nginx/sites-enabled:"
ls /etc/nginx/sites-enabled/

# ¥éÌ†æÌ Eliminar duplicados y default
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/signage.getsnova.com
sudo rm -f /etc/nginx/sites-enabled/old*

# ∑ΩÌ†ΩÌ Probar sintaxis
sudo nginx -t && sudo systemctl restart nginx

# ¥ç‚úÖ Verificaci√≥n de dominios
echo "=============================================="
echo "Ì†ºÌ Verificando estado de dominios..."
echo "=============================================="

echo "ºêÌ†ΩÌ https://api.getsnova.com"
curl -I -s https://api.getsnova.com | head -n 5

echo ""
echo "¥óÌ†ΩÌ https://engineering.getsnova.com"
curl -I -s https://engineering.getsnova.com | head -n 5

echo ""
echo "¥ó‚úÖ Si ves 'HTTP/2 200', ambos est√°n activos correctamente."
echo "=============================================="
