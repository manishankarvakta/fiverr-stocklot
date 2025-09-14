import React from 'react';
import { useSearchParams } from "react-router-dom";

/**
 * 🐾 Exotic & Specialty Livestock Toggle
 * Clean toggle to show/hide exotic animals without cluttering the main interface
 */
export function ExoticToggle() {
  const [params, setParams] = useSearchParams();
  const checked = params.get("include_exotics") === "true";

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          const p = new URLSearchParams(params);
          if (e.target.checked) {
            p.set("include_exotics", "true");
          } else {
            p.delete("include_exotics");
          }
          setParams(p, { replace: true });
        }}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
      />
      <span className="text-gray-700">Show Exotic & Specialty</span>
      <span className="text-xs text-gray-500 ml-1">(Ostrich, Game Animals, etc.)</span>
    </label>
  );
}

export default ExoticToggle;