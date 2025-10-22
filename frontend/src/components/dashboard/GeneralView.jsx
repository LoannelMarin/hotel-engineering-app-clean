import React from "react";
import StatsCards from "../components/dashboard/StatsCards.jsx";
import ProjectsGrid from "../components/dashboard/ProjectsGrid.jsx";
import VendorsSummary from "../components/dashboard/VendorsSummary.jsx";
import TasksOverview from "../components/dashboard/TasksOverview.jsx";
import ActivityChart from "../components/dashboard/ActivityChart.jsx";
import MainOverview from "../components/dashboard/MainOverview.jsx"; // ✅ Nuevo import

export default function GeneralView() {
  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 w-full max-w-[1600px] mx-auto">
      {/* 🔹 Resumen general */}
      <section className="w-full">
        <MainOverview />
      </section>

      {/* 🔸 Tarjetas de métricas */}
      <section className="w-full">
        <StatsCards />
      </section>

      {/* 🔸 Grilla de proyectos */}
      <section className="w-full">
        <ProjectsGrid />
      </section>

      {/* 🔸 Proveedores */}
      <section className="w-full">
        <VendorsSummary />
      </section>

      {/* 🔸 Tareas */}
      <section className="w-full">
        <TasksOverview tasks={[]} />
      </section>

      {/* 🔸 Actividad (gráfico) */}
      <section className="w-full">
        <ActivityChart />
      </section>
    </div>
  );
}
