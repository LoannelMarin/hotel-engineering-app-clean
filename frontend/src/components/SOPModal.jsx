// frontend/src/components/SOPModal.jsx
import React, { useEffect, useState } from "react";
import { X, Loader2, Plus, GripVertical } from "lucide-react";
import api from "../api/client";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function SOPModal({ open, onClose, editing, onSaved }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title || "");
      setDescription(editing.description || "");
      setSteps(editing.steps || []);
    } else {
      setTitle("");
      setDescription("");
      setSteps([]);
    }
  }, [editing]);

  function addStep() {
    setSteps([...steps, { text: "", image_url: "" }]);
  }

  function updateStep(i, field, value) {
    const newSteps = [...steps];
    newSteps[i][field] = value;
    setSteps(newSteps);
  }

  function deleteStep(i) {
    setSteps(steps.filter((_, idx) => idx !== i));
  }

  // 🔹 Handle drag reorder
  function handleDragEnd(result) {
    if (!result.destination) return;
    const reordered = Array.from(steps);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSteps(reordered);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title,
        description,
        steps: steps.map((s, i) => ({
          order: i + 1,
          text: s.text,
          image_url: s.image_url,
        })),
      };

      if (editing?.id) {
        await api.put(`/api/sops/${editing.id}`, payload);
        toast.success("SOP updated successfully");
      } else {
        await api.post("/api/sops/", payload);
        toast.success("SOP created successfully");
      }
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Error saving SOP");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg lg:max-w-2xl p-4 sm:p-6 space-y-4 relative">
        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <h2 className="text-lg sm:text-xl font-semibold text-zinc-800 dark:text-zinc-100 text-center sm:text-left">
          {editing ? "Edit SOP" : "Create SOP"}
        </h2>

        {/* Campos principales */}
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="SOP title"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm sm:text-base"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm sm:text-base min-h-[80px]"
          />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Steps
            </h3>
            <button
              onClick={addStep}
              className="flex items-center justify-center gap-2 bg-[#0B5150] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-[#0C5F5E] text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" /> Add step
            </button>
          </div>

          {steps.length === 0 && (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm italic">
              No steps added yet.
            </p>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="steps">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-3"
                >
                  {steps.map((s, i) => (
                    <Draggable key={i} draggableId={String(i)} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 sm:p-4 space-y-2 bg-transparent ${
                            snapshot.isDragging ? "bg-zinc-800/10 dark:bg-zinc-800/30" : ""
                          }`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="flex items-center gap-2 cursor-grab text-zinc-400"
                          >
                            <GripVertical className="w-4 h-4" />
                            <span className="text-xs text-zinc-400">Step {i + 1}</span>
                          </div>

                          <textarea
                            value={s.text}
                            onChange={(e) =>
                              updateStep(i, "text", e.target.value)
                            }
                            placeholder={`Step ${i + 1}`}
                            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-sm sm:text-base"
                          />
                          <input
                            type="text"
                            value={s.image_url}
                            onChange={(e) =>
                              updateStep(i, "image_url", e.target.value)
                            }
                            placeholder="Image URL (optional)"
                            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-xs sm:text-sm"
                          />
                          <button
                            onClick={() => deleteStep(i)}
                            className="text-red-500 text-xs sm:text-sm hover:underline"
                          >
                            Delete step
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Save button */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-[#0B5150] text-white w-full sm:w-auto px-4 py-2 rounded-lg hover:bg-[#0C5F5E] transition disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save SOP"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
