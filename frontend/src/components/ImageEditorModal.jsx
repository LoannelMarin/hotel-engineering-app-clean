// frontend/src/components/ImageEditorModal.jsx
import React, { useRef, useState, useEffect } from "react";
import { X, Save, RotateCcw } from "lucide-react";

export default function ImageEditorModal({ open, image, onClose, onSave }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const imgRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#ff0000");
  const [lineWidth, setLineWidth] = useState(2);
  const [textInput, setTextInput] = useState("");
  const [history, setHistory] = useState([]);
  const [startPos, setStartPos] = useState(null);

  useEffect(() => {
    if (!open || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = image;

    img.onload = () => {
      const maxWidth = 900;
      const maxHeight = 600;
      let width = img.width;
      let height = img.height;

      const scale = Math.min(maxWidth / width, maxHeight / height, 1);
      width *= scale;
      height *= scale;

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      imgRef.current = img;
      ctxRef.current = ctx;
      setHistory([canvas.toDataURL()]);
    };
  }, [open, image]);

  function startDraw(e) {
    if (tool === "text") return;
    const ctx = ctxRef.current;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    setStartPos({ x, y });
    if (tool === "pen") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    setDrawing(true);
  }

  function draw(e) {
    if (!drawing || tool === "text") return;
    const ctx = ctxRef.current;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    if (tool === "pen") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      const canvas = canvasRef.current;
      const img = new Image();
      img.src = history[history.length - 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        ctx.beginPath();

        if (tool === "square") {
          ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
        } else if (tool === "circle") {
          const radius = Math.sqrt(
            Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
          );
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      };
    }
  }

  function stopDraw() {
    if (!drawing) return;
    const canvas = canvasRef.current;
    setHistory((prev) => [...prev, canvas.toDataURL()]);
    setDrawing(false);
  }

  function handleAddText(e) {
    if (tool !== "text" || !textInput.trim()) return;
    const ctx = ctxRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.fillStyle = color;
    ctx.font = `${16 + lineWidth * 2}px Arial`;
    ctx.fillText(textInput, x, y);
    setTextInput("");
    setHistory((prev) => [...prev, canvasRef.current.toDataURL()]);
  }

  function handleUndo() {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop();
    const last = newHistory[newHistory.length - 1];
    const ctx = ctxRef.current;
    const img = new Image();
    img.src = last;
    img.onload = () => ctx.drawImage(img, 0, 0);
    setHistory(newHistory);
  }

  function handleReset() {
    if (!imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    setHistory([canvas.toDataURL()]);
  }

  function handleSave() {
    const canvas = canvasRef.current;
    onSave(canvas.toDataURL("image/png"));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-5xl
                   p-3 sm:p-5 flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            Image Editor
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            <X className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between border-b pb-2 border-zinc-200 dark:border-zinc-700">
          <div className="flex flex-wrap gap-2 items-center">
            {["pen", "text", "square", "circle"].map((t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  tool === t
                    ? "bg-[#0B5150] text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-end w-full sm:w-auto">
            <label className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
              Color
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 rounded border border-zinc-300 dark:border-zinc-700"
              />
            </label>

            <label className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
              Size
              <input
                type="range"
                min="1"
                max="10"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="accent-[#0B5150] w-24"
              />
            </label>

            <button
              onClick={handleUndo}
              className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            >
              Undo
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 transition"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="overflow-x-auto flex justify-center bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseUp={stopDraw}
            onMouseMove={draw}
            onClick={handleAddText}
            className="cursor-crosshair rounded-xl shadow-sm border border-zinc-300 dark:border-zinc-700"
          />
        </div>

        {/* Text input */}
        {tool === "text" && (
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Enter text..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-2 text-sm"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition text-zinc-800 dark:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm bg-[#0B5150] text-white hover:bg-[#0C5F5E] transition"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
