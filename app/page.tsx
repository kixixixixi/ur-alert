import { FC } from "react"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import type { Snapshot, DiffResult } from "scripts/types"
import PropertyList from "components/PropertyList"

function loadJson<T>(path: string): T | null {
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, "utf-8"))
}

const Page: FC = () => {
  const dataDir = join(process.cwd(), "data")
  const snapshot = loadJson<Snapshot>(join(dataDir, "latest.json"))
  const diff = loadJson<DiffResult>(join(dataDir, "diff.json"))

  if (!snapshot || snapshot.items.length === 0) {
    return (
      <p style={{ color: "#888", padding: "2rem", textAlign: "center" }}>
        データがまだありません。fetch:ur を実行してください。
      </p>
    )
  }

  return (
    <PropertyList
      items={snapshot.items}
      snapshotDate={snapshot.snapshot_date}
      newItemIds={diff?.new_item_ids ?? []}
    />
  )
}

export default Page
