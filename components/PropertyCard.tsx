import { FC } from "react"
import type { UrItem } from "scripts/types"

interface PropertyCardProps {
  item: UrItem
  isNew: boolean
}

const PropertyCard: FC<PropertyCardProps> = ({ item, isNew }) => {
  return (
    <div
      style={{
        backgroundColor: "#2a2a2a",
        border: isNew ? "1px solid #4caf50" : "1px solid #444",
        borderRadius: "8px",
        padding: "1rem",
        position: "relative",
      }}
    >
      {isNew && (
        <span
          style={{
            backgroundColor: "#4caf50",
            borderRadius: "4px",
            color: "#fff",
            fontSize: "0.7rem",
            fontWeight: "bold",
            padding: "2px 6px",
            position: "absolute",
            right: "8px",
            top: "8px",
          }}
        >
          NEW
        </span>
      )}
      <h3 style={{ fontSize: "1rem", margin: "0 0 0.25rem" }}>
        {item.bukkenName}
      </h3>
      {item.address && (
        <p style={{ color: "#999", fontSize: "0.75rem", margin: "0 0 0.25rem" }}>
          {item.address}
        </p>
      )}
      <p style={{ color: "#aaa", fontSize: "0.85rem", margin: "0 0 0.5rem" }}>
        {item.roomNo}
      </p>
      <div
        style={{
          display: "grid",
          gap: "0.25rem",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <div>
          <span style={{ color: "#aaa", fontSize: "0.75rem" }}>家賃</span>
          <p style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>
            {item.rent.toLocaleString()}円
          </p>
        </div>
        <div>
          <span style={{ color: "#aaa", fontSize: "0.75rem" }}>共益費</span>
          <p style={{ fontSize: "0.9rem", margin: 0 }}>
            {item.commonfee.toLocaleString()}円
          </p>
        </div>
        <div>
          <span style={{ color: "#aaa", fontSize: "0.75rem" }}>間取り</span>
          <p style={{ fontSize: "0.9rem", margin: 0 }}>{item.layout}</p>
        </div>
        <div>
          <span style={{ color: "#aaa", fontSize: "0.75rem" }}>面積</span>
          <p style={{ fontSize: "0.9rem", margin: 0 }}>{item.floorspace}㎡</p>
        </div>
      </div>
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#64b5f6",
            display: "inline-block",
            fontSize: "0.85rem",
            marginTop: "0.5rem",
          }}
        >
          詳細を見る →
        </a>
      )}
    </div>
  )
}

export default PropertyCard
