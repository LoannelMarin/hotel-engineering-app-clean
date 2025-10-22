// frontend/src/components/AssetSelector.jsx
import React from "react";

export default function AssetSelector({ items, value, onChange }) {
  return (
    <select
      name="asset_id"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="select select-bordered w-full"
    >
      <option value="">Select asset</option>
      {items.map((asset) => (
        <option key={asset.id} value={asset.id}>
          {asset.name} ({asset.location})
        </option>
      ))}
    </select>
  );
}
