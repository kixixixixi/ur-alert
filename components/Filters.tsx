"use client"

import { FC } from "react"

export interface FilterValues {
  rentMin: string
  rentMax: string
  layouts: string[]
  areas: string[]
}

interface FiltersProps {
  values: FilterValues
  onChange: (values: FilterValues) => void
  availableLayouts: string[]
  availableAreas: string[]
}

const Filters: FC<FiltersProps> = ({ values, onChange, availableLayouts, availableAreas }) => {
  const inputStyle = {
    backgroundColor: "#333",
    border: "1px solid #555",
    borderRadius: "4px",
    color: "#f0f0f0",
    fontSize: "0.85rem",
    padding: "0.4rem",
    width: "100px",
  } as const

  return (
    <div
      style={{
        alignItems: "flex-end",
        backgroundColor: "#2a2a2a",
        borderRadius: "8px",
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "1rem",
        padding: "1rem",
      }}
    >
      <label>
        <span
          style={{ color: "#aaa", display: "block", fontSize: "0.75rem", marginBottom: "4px" }}
        >
          家賃（下限）
        </span>
        <input
          type="number"
          placeholder="0"
          value={values.rentMin}
          onChange={(e) => onChange({ ...values, rentMin: e.target.value })}
          style={inputStyle}
        />
      </label>
      <label>
        <span
          style={{ color: "#aaa", display: "block", fontSize: "0.75rem", marginBottom: "4px" }}
        >
          家賃（上限）
        </span>
        <input
          type="number"
          placeholder="999999"
          value={values.rentMax}
          onChange={(e) => onChange({ ...values, rentMax: e.target.value })}
          style={inputStyle}
        />
      </label>
      <div>
        <span
          style={{ color: "#aaa", display: "block", fontSize: "0.75rem", marginBottom: "4px" }}
        >
          間取り
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {availableLayouts.map((layout) => (
            <label
              key={layout}
              style={{
                alignItems: "center",
                backgroundColor: values.layouts.includes(layout) ? "#4caf50" : "#444",
                borderRadius: "4px",
                color: "#f0f0f0",
                cursor: "pointer",
                display: "flex",
                fontSize: "0.8rem",
                gap: "4px",
                padding: "4px 8px",
              }}
            >
              <input
                type="checkbox"
                checked={values.layouts.includes(layout)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...values.layouts, layout]
                    : values.layouts.filter((l) => l !== layout)
                  onChange({ ...values, layouts: next })
                }}
                style={{ display: "none" }}
              />
              {layout}
            </label>
          ))}
        </div>
      </div>
      <div>
        <span
          style={{ color: "#aaa", display: "block", fontSize: "0.75rem", marginBottom: "4px" }}
        >
          行政区
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {availableAreas.map((area) => (
            <label
              key={area}
              style={{
                alignItems: "center",
                backgroundColor: values.areas.includes(area) ? "#4caf50" : "#444",
                borderRadius: "4px",
                color: "#f0f0f0",
                cursor: "pointer",
                display: "flex",
                fontSize: "0.8rem",
                gap: "4px",
                padding: "4px 8px",
              }}
            >
              <input
                type="checkbox"
                checked={values.areas.includes(area)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...values.areas, area]
                    : values.areas.filter((a) => a !== area)
                  onChange({ ...values, areas: next })
                }}
                style={{ display: "none" }}
              />
              {area}
            </label>
          ))}
        </div>
      </div>
      <button
        onClick={() => onChange({ rentMin: "", rentMax: "", layouts: [], areas: [] })}
        style={{
          backgroundColor: "#555",
          border: "none",
          borderRadius: "4px",
          color: "#f0f0f0",
          cursor: "pointer",
          fontSize: "0.8rem",
          padding: "0.4rem 0.8rem",
        }}
      >
        クリア
      </button>
    </div>
  )
}

export default Filters
