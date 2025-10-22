# backend/models/__init__.py
from backend.extensions import db  # 👈 Usa la instancia existente (no crear otra)

# =====================================================
# Import models in dependency order to avoid FK issues
# =====================================================

# Core / Assets
from .asset import Asset  # ✅ Asset primero (otros modelos pueden referenciarlo)
from .manual import Manual  # ✅ Manuals pueden asociarse a Assets
from .sop import SOP, SOPStep  # ✅ SOPs pueden también asociarse a Assets

# Users and Tasks
from .user import User
from .task import Task
from .task_activity import TaskActivity
from .task_comment import TaskComment

# Inventory
from .inventory import InventoryItem
from .inventory_log import InventoryLog

# Vendors / Quotes / Invoices
from .vendor import Vendor
from .quote import Quote
from .invoice import Invoice

# Projects and related tracking
from .project import Project, ProjectRoomStatus, ProjectRoomAudit

# Inspections
from .inspection import Inspection
from .inspection_item import InspectionItem

# Asset status tracking
from .asset_status import AssetStatus

# INNCOM system
from .inncom_temp import InncomTemp  # ✅ Agregado correctamente

# =====================================================
# Public exports (para uso en blueprints y seeds)
# =====================================================
__all__ = [
    # Core
    "Asset",
    "Manual",
    "SOP",
    "SOPStep",

    # Users / Tasks
    "User",
    "Task",
    "TaskActivity",
    "TaskComment",

    # Inventory
    "InventoryItem",
    "InventoryLog",

    # Vendors / Quotes / Invoices
    "Vendor",
    "Quote",
    "Invoice",

    # Projects
    "Project",
    "ProjectRoomStatus",
    "ProjectRoomAudit",

    # Inspections
    "Inspection",
    "InspectionItem",

    # Asset Status
    "AssetStatus",

    # INNCOM
    "InncomTemp",
]
