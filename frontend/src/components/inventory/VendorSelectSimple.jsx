// frontend/src/components/inventory/VendorSelectSimple.jsx
import React, { useEffect, useState } from "react";
import Select, { components } from "react-select"; // ✅ ya sin require()
import { Plus } from "lucide-react";
import { fetchWithAuth } from "../../utils/api"; // ✅ ruta corregida

export default function VendorSelectSimple({ value, onChange }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/vendors/");
        const data = res?.items || res || [];
        const opts = data.map((v) => ({
          value: v.id,
          label: v.name,
          logo_url: v.logo_url,
        }));
        setVendors(opts);
      } catch (err) {
        console.error("Error loading vendors:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "var(--surface-2)",
      borderColor: state.isFocused ? "var(--accent-green)" : "var(--border-1)",
      color: "var(--text-1)",
      minHeight: "38px",
      boxShadow: "none",
      "&:hover": { borderColor: "var(--accent-green)" },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--surface-2)",
      border: "1px solid var(--border-1)",
      zIndex: 50,
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--text-1)",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? "var(--surface-3)" : "transparent",
      color: "var(--text-1)",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      cursor: "pointer",
    }),
  };

  const Option = (props) => (
    <components.Option {...props}>
      {props.data.logo_url && (
        <img
          src={props.data.logo_url}
          alt={props.data.label}
          className="w-6 h-6 rounded object-cover"
        />
      )}
      {props.data.label}
    </components.Option>
  );

  const SingleValue = (props) => (
    <components.SingleValue {...props}>
      {props.data.logo_url && (
        <img
          src={props.data.logo_url}
          alt={props.data.label}
          className="w-5 h-5 rounded object-cover"
        />
      )}
      {props.data.label}
    </components.SingleValue>
  );

  const handleAddNew = () => {
    window.open("/vendors", "_blank");
  };

  const optionsWithAdd = [
    ...vendors,
    { value: "__new__", label: "➕ Add new vendor", isNew: true },
  ];

  const handleChange = (opt) => {
    if (opt?.isNew) return handleAddNew();
    onChange(opt);
  };

  return (
    <Select
      isLoading={loading}
      options={optionsWithAdd}
      value={value}
      onChange={handleChange}
      styles={customStyles}
      placeholder="Select vendor..."
      components={{ Option, SingleValue }}
      noOptionsMessage={() => "No matches"}
      filterOption={(option, inputValue) =>
        option.data.label?.toLowerCase()?.includes(inputValue.toLowerCase())
      }
    />
  );
}
