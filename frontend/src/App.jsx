// frontend/src/App.jsx
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "sonner";

// ================== Pages ==================
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ToDo from "./pages/ToDo";
import ToDoRecords from "./pages/ToDoRecords";
import Inventory from "./pages/Inventory";
import InventoryLogs from "./pages/InventoryLogs";
import Vendors from "./pages/Vendors";
import QuotesEstimates from "./pages/QuotesEstimates";
import InvoiceTracker from "./pages/InvoiceTracker";
import AssetData from "./pages/AssetData";
import Projects from "./pages/Projects";
import ProjectsTableView from "./pages/ProjectsTableView";
import ProjectPrintView from "./pages/ProjectPrintView";
import Users from "./pages/Users";
import Paint from "./pages/Paint";
import Schedule from "./pages/Schedule";
import LicensesPermits from "./pages/LicensesPermits";
import PMs from "./pages/PMs";
import Documents from "./pages/Documents";
import Manuals from "./pages/Manuals";
import CalendarPage from "./pages/Calendar";
import RoomStatus from "./pages/RoomStatus.jsx";


// 🆕 Inspections
import InspectionsHub from "./pages/InspectionsHub.jsx";
import InspectionRun from "./pages/InspectionRun.jsx";
import InspectionView from "./pages/InspectionView.jsx";
import InspectionPrint from "./pages/InspectionPrint.jsx";

// 🆕 SOP modules
import SOPManualCreator from "./pages/SOPManualCreator.jsx";
import SOPViewer from "./pages/SOPViewer.jsx";

// ================== UI Helpers ==================
import PrimaryButton from "./ui/PrimaryButton";

/* ===================================================
   JWT helpers
=================================================== */
function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const p = decodeJwt(token);
  if (!p || typeof p.exp !== "number") return false;
  const now = Math.floor(Date.now() / 1000);
  return p.exp > now;
}

function RootRedirect() {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  if (isTokenValid(token)) {
    return <Navigate to="/dashboard" replace />;
  }
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_id");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("user_id");
  return <Navigate to="/login" replace />;
}

/* ===================================================
   Layout principal — con Sidebar responsive
=================================================== */
function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebar_collapsed") === "1"
  );

  // valores base del ancho del sidebar
  const sidebarW = collapsed ? "4rem" : "16rem";

  return (
    <div
      className="min-h-screen flex transition-colors duration-300
                 bg-surface-day dark:bg-surface-dark text-zinc-900 dark:text-zinc-100"
      style={{ "--sidebar-w": sidebarW }}
    >
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* 💡 Contenedor del contenido principal */}
      <main
        className="
          flex-1 min-h-screen transition-all duration-300 ease-in-out
          bg-surface-day dark:bg-surface-dark text-zinc-900 dark:text-zinc-100
          px-3 sm:px-5 lg:px-8
        "
        style={{
          marginLeft: "var(--sidebar-w, 4rem)",
          transition: "margin-left 0.3s ease",
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          paddingTop: "0.75rem", // 🔧 reducido: evita espacio extra arriba
        }}
      >
        {children}
      </main>
    </div>
  );
}

/* ===================================================
   App principal
=================================================== */
export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        {/* ================== Routes protegidas ================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/todo"
          element={
            <ProtectedRoute>
              <Layout>
                <ToDo />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/todo/records"
          element={
            <ProtectedRoute>
              <Layout>
                <ToDoRecords />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Inventory */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/logs"
          element={
            <ProtectedRoute>
              <Layout>
                <InventoryLogs />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Vendors / Quotes / Invoices */}
        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <Layout>
                <Vendors />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotes"
          element={
            <ProtectedRoute>
              <Layout>
                <QuotesEstimates />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <Layout>
                <InvoiceTracker />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Assets / Projects / Users */}
        <Route
          path="/assets"
          element={
            <ProtectedRoute>
              <Layout>
                <AssetData />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectsTableView />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/summary"
          element={
            <ProtectedRoute>
              <Layout>
                <Projects />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/print/:id"
          element={
            <ProtectedRoute>
              <ProjectPrintView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Paint / Schedule / Licenses / PMs */}
        <Route
          path="/paint"
          element={
            <ProtectedRoute>
              <Layout>
                <Paint />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <Layout>
                <Schedule />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/licenses-permits"
          element={
            <ProtectedRoute>
              <Layout>
                <LicensesPermits />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pms"
          element={
            <ProtectedRoute>
              <Layout>
                <PMs />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Documents / Manuals */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Layout>
                <Documents />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manuals"
          element={
            <ProtectedRoute>
              <Layout>
                <Manuals />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* SOP */}
        <Route
          path="/sop/create"
          element={
            <ProtectedRoute>
              <Layout>
                <SOPManualCreator />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sop/view/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <SOPViewer />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Calendar */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <CalendarPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Inspections */}
        <Route
          path="/inspections"
          element={
            <ProtectedRoute>
              <Layout>
                <InspectionsHub />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspections/:inspectionId/run"
          element={
            <ProtectedRoute>
              <Layout>
                <InspectionRun />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspections/:inspectionId/view"
          element={
            <ProtectedRoute>
              <Layout>
                <InspectionView />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspections/:inspectionId/print"
          element={
            <ProtectedRoute>
              <InspectionPrint />
            </ProtectedRoute>
          }
        />

        {/* Room Status */}
        <Route
          path="/room-status"
          element={
            <ProtectedRoute>
              <Layout>
                <RoomStatus />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
