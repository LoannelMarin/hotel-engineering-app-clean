# backend/routes/__init__.py
from .auth import bp as auth_bp
from .tasks import bp as tasks_bp
from .inventory import bp as inventory_bp
from .vendors import bp as vendors_bp
from .quotes import bp as quotes_bp
from .invoices import bp as invoices_bp
from .assets import bp as assets_bp
from .projects import bp as projects_bp
from .users import bp as users_bp
from .uploads import bp as uploads_bp
from .manuals import bp as manuals_bp

# ✅ Technical integrations (INNCOM)
from backend.routes.inncom import inncom_bp

# ✅ SOP system (database-based)
from .sops import bp as sops_bp


def register_blueprints(app):
    """Register all Flask blueprints."""

    # 🔐 Auth & users
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")

    # 🧾 Core maintenance
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(vendors_bp, url_prefix="/api/vendors")
    app.register_blueprint(quotes_bp, url_prefix="/api/quotes")
    app.register_blueprint(invoices_bp, url_prefix="/api/invoices")
    app.register_blueprint(assets_bp, url_prefix="/api/assets")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")

    # 📚 Documentation & manuals
    app.register_blueprint(manuals_bp, url_prefix="/api/manuals")

    # 📘 SOPs
    app.register_blueprint(sops_bp)  # prefix already defined inside the blueprint

    # 🔧 Technical integrations (INNCOM)
    app.register_blueprint(inncom_bp)

    # 📂 File uploads (PDFs, images, etc.)
    # ⚙️ No url_prefix aquí porque el blueprint ya define /api internamente
    app.register_blueprint(uploads_bp)
