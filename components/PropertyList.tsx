"use client"

import { FC, useState, useMemo } from "react"
import type { UrItem } from "scripts/types"
import PropertyCard from "./PropertyCard"
import Filters, { FilterValues } from "./Filters"

interface PropertyListProps {
  items: UrItem[]
  snapshotDate: string
  newItemIds: string[]
}

const PropertyList: FC<PropertyListProps> = ({ items, snapshotDate, newItemIds }) => {
  const [filters, setFilters] = useState<FilterValues>({
    rentMin: "",
    rentMax: "",
    layouts: [],
    areas: [],
  })

  const availableLayouts = useMemo(() => {
    const set = new Set(items.map((i) => i.layout))
    return Array.from(set).sort()
  }, [items])

  const availableAreas = useMemo(() => {
    const set = new Set(
      items.map((i) => {
        const match = (i.address || "").match(/^(.+?[区市町村])/)
        return match ? match[1] : ""
      }).filter(Boolean)
    )
    return Array.from(set).sort()
  }, [items])

  const newIdSet = useMemo(() => new Set(newItemIds), [newItemIds])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filters.rentMin && item.rent < Number(filters.rentMin)) return false
      if (filters.rentMax && item.rent > Number(filters.rentMax)) return false
      if (filters.layouts.length > 0 && !filters.layouts.includes(item.layout))
        return false
      if (filters.areas.length > 0) {
        const match = (item.address || "").match(/^(.+?[区市町村])/)
        const area = match ? match[1] : ""
        if (!filters.areas.includes(area)) return false
      }
      return true
    })
  }, [items, filters])

  return (
    <div>
      <p style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
        更新日: {snapshotDate} / 全{items.length}件 / 表示{filtered.length}件
      </p>
      <Filters
        values={filters}
        onChange={setFilters}
        availableLayouts={availableLayouts}
        availableAreas={availableAreas}
      />
      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}
      >
        {filtered.map((item) => {
          const uid = item.roomNo
            ? `${item.bukkenNo}:${item.roomNo}`
            : item.bukkenNo
          return (
            <PropertyCard key={uid} item={item} isNew={newIdSet.has(uid)} />
          )
        })}
      </div>
      {filtered.length === 0 && (
        <p style={{ color: "#888", textAlign: "center", padding: "2rem" }}>
          条件に一致する物件がありません
        </p>
      )}
    </div>
  )
}

export default PropertyList
