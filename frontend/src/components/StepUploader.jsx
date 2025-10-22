// frontend/src/components/StepUploader.jsx
import React, { useState } from "react";
import { Trash2, Edit3, Upload } from "lucide-react";
import ImageEditorModal from "./ImageEditorModal";

export default function StepUploader({ step, index, onChange, onDelete }) {
  const [editorOpen, setEditorOpen] = useState(false);

  function handleDescription(e) {
    onChange(index, { ...step, text: e.target.value });
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(index, { ...step, image: event.target.result });
    };
    reader.readAsDataURL(file);
  }

  function handleImageSave(editedImg) {
    onChange(index, { ...step, image: editedImg });
    setEditorOpen(false);
  }

  return (
    <div className="rounded-2xl p-3 sm:p-4 mb-6 bg-white dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 relative shadow-sm transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <h3 className="font-semibold text-slate-800 dark:text-white text-base sm:text-lg">
          Step {index + 1}
        </h3>
        <button
          onClick={() => onDelete(index)}
          className="text-red-500 hover:text-red-400 transition"
          title="Delete step"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Description */}
      <textarea
        value={step.text || ""}
        onChange={handleDescription}
        placeholder="Describe what to do in this step..."
        className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white p-2 sm:p-3 text-sm sm:text-base mb-3 focus:ring-2 focus:ring-[#0B5150] resize-y min-h-[80px] sm:min-h-[100px]"
      />

      {/* Image area */}
      <div
        className="relative w-full rounded-xl overflow-hidden
                   border border-slate-200 dark:border-zinc-700
                   bg-[#f8f9fa] dark:bg-black
                   shadow-sm hover:ring-2 hover:ring-[#0B5150]/60 transition-all"
      >
        <div className="aspect-[4/3] sm:aspect-[16/5] w-full flex items-center justify-center max-h-[250px] sm:max-h-[300px]">
          {step.image ? (
            <img
              src={step.image}
              alt={`Step ${index + 1}`}
              className="object-contain w-full h-full select-none pointer-events-none"
              draggable={false}
            />
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-500 hover:text-[#0B5150] transition">
              <Upload className="w-7 h-7 sm:w-8 sm:h-8 mb-2 opacity-70" />
              <span className="text-xs sm:text-sm">Upload image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        {step.image && (
          <button
            onClick={() => setEditorOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[#0B5150] text-white hover:bg-[#0C5F5E] transition text-sm sm:text-base"
          >
            <Edit3 className="w-4 h-4" /> Edit Image
          </button>
        )}
      </div>

      {/* Modal Editor */}
      <ImageEditorModal
        open={editorOpen}
        image={step.image}
        onClose={() => setEditorOpen(false)}
        onSave={handleImageSave}
      />
    </div>
  );
}
