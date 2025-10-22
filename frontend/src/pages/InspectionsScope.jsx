// src/pages/InspectionsScope.jsx
import React from "react";
import { Wrench } from "lucide-react";

export default function InspectionsScope() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Título */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
        Ámbito de Inspección
      </h1>

      {/* Descripción */}
      <p className="text-gray-600 dark:text-slate-300 max-w-xl">
        Esta pantalla permitirá desglosar sub-secciones dentro del ámbito
        seleccionado (por ejemplo, por piso, área o tipo de activo).
      </p>

      {/* Card de estado */}
      <div
        className="mt-8 rounded-2xl border border-gray-200 dark:border-white/10
        bg-white/90 dark:bg-[#1d1f24]/90 shadow-sm p-6 w-full max-w-md
        flex flex-col items-center justify-center"
      >
        <Wrench size={40} className="text-[#0B5150] dark:text-[#5ad5d3] mb-3 animate-spin-slow" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-1">
          En construcción
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Estamos trabajando para habilitar esta sección pronto.
        </p>
      </div>

      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 6s linear infinite;
        }
      `}</style>
    </div>
  );
}
