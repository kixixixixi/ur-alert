import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs"
import { join } from "path"
import type { Snapshot, DiffResult, DiffEntry, UrItem } from "./types"

function unitId(item: UrItem): string {
  return item.roomNo ? `${item.bukkenNo}:${item.roomNo}` : item.bukkenNo
}

function main() {
  const snapshotsDir = join(process.cwd(), "data", "snapshots")
  const diffFile = join(process.cwd(), "data", "diff.json")

  if (!existsSync(snapshotsDir)) {
    console.log("No snapshots directory found.")
    const emptyDiff: DiffResult = {
      diff_date: "",
      previous_date: "",
      entries: [],
      new_item_ids: [],
    }
    writeFileSync(diffFile, JSON.stringify(emptyDiff, null, 2))
    return
  }

  const files = readdirSync(snapshotsDir)
    .filter((f) => f.endsWith(".json"))
    .sort()

  if (files.length < 2) {
    console.log("Need at least 2 snapshots for diff.")
    const emptyDiff: DiffResult = {
      diff_date: files.length > 0 ? files[files.length - 1].replace(".json", "") : "",
      previous_date: "",
      entries: [],
      new_item_ids: [],
    }
    writeFileSync(diffFile, JSON.stringify(emptyDiff, null, 2))
    return
  }

  const latestFile = files[files.length - 1]
  const previousFile = files[files.length - 2]

  const latest: Snapshot = JSON.parse(
    readFileSync(join(snapshotsDir, latestFile), "utf-8")
  )
  const previous: Snapshot = JSON.parse(
    readFileSync(join(snapshotsDir, previousFile), "utf-8")
  )

  const prevMap = new Map<string, UrItem>()
  for (const item of previous.items) {
    prevMap.set(unitId(item), item)
  }

  const currMap = new Map<string, UrItem>()
  for (const item of latest.items) {
    currMap.set(unitId(item), item)
  }

  const entries: DiffEntry[] = []
  const newItemIds: string[] = []

  // New items
  for (const [uid, item] of currMap) {
    const prev = prevMap.get(uid)
    if (!prev) {
      entries.push({ type: "new", item })
      newItemIds.push(uid)
    } else {
      if (prev.rent !== item.rent) {
        entries.push({
          type: "rent_changed",
          item,
          previous: { rent: prev.rent },
        })
      }
      if (prev.status !== item.status) {
        entries.push({
          type: "status_changed",
          item,
          previous: { status: prev.status },
        })
      }
    }
  }

  // Removed items
  for (const [uid, item] of prevMap) {
    if (!currMap.has(uid)) {
      entries.push({ type: "removed", item })
    }
  }

  const diff: DiffResult = {
    diff_date: latest.snapshot_date,
    previous_date: previous.snapshot_date,
    entries,
    new_item_ids: newItemIds,
  }

  writeFileSync(diffFile, JSON.stringify(diff, null, 2))
  console.log(
    `Diff: ${newItemIds.length} new, ${entries.filter((e) => e.type === "removed").length} removed, ${entries.filter((e) => e.type === "rent_changed").length} rent changed`
  )
}

main()
