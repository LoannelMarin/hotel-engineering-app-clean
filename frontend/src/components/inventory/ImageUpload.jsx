import React, { useRef, useState } from "react";
import { Image as ImageIcon, Link2 } from "lucide-react";

export default function ImageUpload({ value, onChange }) {
  const [preview, setPreview] = useState(value || "");
  const inputRef = useRef(null);

  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      onChange?.(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    onFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        className="dropzone anim-scale"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img src={preview} alt="preview" className="max-h-48 rounded-md object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon size={28} />
            <div className="text-sm">Arrastra una imagen o haz click para seleccionar</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      <div className="flex items-center gap-2">
        <Link2 size={16} className="opacity-70" />
        <input
          className="input w-full"
          placeholder="...o pega una URL de imagen"
          value={preview}
          onChange={(e) => { setPreview(e.target.value); onChange?.(e.target.value); }}
        />
      </div>
    </div>
  );
}
