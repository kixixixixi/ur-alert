export interface UrItem {
  bukkenNo: string
  roomNo: string
  bukkenName: string
  address: string
  rent: number
  commonfee: number
  layout: string
  floorspace: number
  floor: string
  status: string
  url: string
  imageUrl?: string
  madoriUrl?: string
}

export interface Snapshot {
  snapshot_date: string
  items: UrItem[]
}

export interface DiffEntry {
  type: "new" | "removed" | "rent_changed" | "status_changed"
  item: UrItem
  previous?: Partial<UrItem>
}

export interface DiffResult {
  diff_date: string
  previous_date: string
  entries: DiffEntry[]
  new_item_ids: string[]
}
