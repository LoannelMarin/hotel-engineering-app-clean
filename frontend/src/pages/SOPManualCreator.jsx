// frontend/src/pages/SOPManualCreator.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Save, ArrowLeft, Loader2 } from "lucide-react";
import StepUploader from "../components/StepUploader";
import api from "../api/client";

export default function SOPManualCreator() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sopId = params.get("id");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Manual");
  const [assetId, setAssetId] = useState("");
  const [assets, setAssets] = useState([]);

  const [steps, setSteps] = useState([{ text: "", image: "" }]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------
  // Load SOP if editing
  // ------------------------------------------------------------
  useEffect(() => {
    if (sopId) loadExisting();
  }, [sopId]);

  async function loadExisting() {
    try {
      setLoading(true);
      const res = await api.get(`/api/sops/${sopId}`);
      setTitle(res.title || "");
      setDescription(res.description || "");
      setCategory(res.category || "Manual");
      setAssetId(res.asset_id || "");
      const mapped = (res.steps || []).map((s) => ({
        text: s.text || "",
        image: s.image_url || "",
      }));
      setSteps(mapped.length ? mapped : [{ text: "", image: "" }]);
    } catch (err) {
      console.error("❌ Error loading SOP:", err);
      alert("Failed to load SOP for editing.");
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------
  // Load assets list
  // ------------------------------------------------------------
  useEffect(() => {
    async function loadAssets() {
      try {
        const res = await api.get("/api/assets");
        const data = res.data || res;
        let list = [];

        if (Array.isArray(data?.items)) list = data.items;
        else if (Array.isArray(data)) list = data;
        else if (data?.items && typeof data.items === "object")
          list = Object.values(data.items);
        else list = [];

        setAssets(list);
      } catch (err) {
        console.error("❌ Error loading assets:", err);
        setAssets([]);
      }
    }
    loadAssets();
  }, []);

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  function handleAddStep() {
    setSteps([...steps, { text: "", image: "" }]);
  }

  function handleDeleteStep(index) {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
  }

  function handleStepChange(index, newStep) {
    const updated = [...steps];
    updated[index] = newStep;
    setSteps(updated);
  }

  async function handleSave() {
    if (!title.trim()) return alert("Please enter a title.");
    setSaving(true);

    const payload = {
      title,
      description,
      category,
      asset_id: assetId || null,
      steps,
    };

    try {
      if (sopId) {
        await api.put(`/api/sops/${sopId}`, payload);
        alert("✅ SOP updated successfully!");
      } else {
        await api.post("/api/sops/", payload);
        alert("✅ SOP created successfully!");
      }
      navigate("/manuals");
    } catch (err) {
      console.error("❌ Failed to save SOP:", err);
      alert("Error saving SOP.");
    } finally {
      setSaving(false);
    }
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] transition-colors p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/manuals")}
          className="flex items-center gap-2 text-[#0B5150] hover:text-[#0C5F5E] text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Manuals
        </button>

        {loading && <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold">
          {sopId ? "Edit SOP" : "Create New SOP"}
        </h1>
      </div>

      {/* --- SOP Info --- */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 space-y-4 sm:space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter SOP title"
            className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 sm:p-3 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
            className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 sm:p-3 min-h-[90px] sm:min-h-[120px] text-sm sm:text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 sm:p-3 text-sm sm:text-base"
            >
              <option value="Manual">Manual</option>
              <option value="HowTo">How-To</option>
              <option value="Troubleshooting">Troubleshooting</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium mb-1">
              Asset (optional)
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 sm:p-3 text-sm sm:text-base"
            >
              <option value="">— None —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.floor ? `(${a.floor})` : ""}{" "}
                  {a.area ? `- ${a.area}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- SOP Steps --- */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold">Steps</h2>

        {steps.map((step, i) => (
          <StepUploader
            key={i}
            step={step}
            index={i}
            onChange={handleStepChange}
            onDelete={handleDeleteStep}
            previewSize="small"
          />
        ))}

        <button
          onClick={handleAddStep}
          className="flex items-center gap-2 text-[#0B5150] hover:text-[#0C5F5E] font-medium text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" /> Add Step
        </button>
      </div>

      {/* Save button */}
      <div className="pt-6 flex justify-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#0B5150] text-white hover:bg-[#0C5F5E] transition disabled:opacity-60 text-sm sm:text-base"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save SOP"}
        </button>
      </div>
    </div>
  );
}
