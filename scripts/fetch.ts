import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import type { UrItem, Snapshot } from "./types"

const API_URL =
  "https://chintai.r6.ur-net.go.jp/chintai/api/bukken/result/bukken_result/"
const BASE_URL = "https://www.ur-net.go.jp"
const PAGE_SIZE = 100
const DELAY_MS = 1000

// Tokyo 23 wards + municipal areas
const SKCS_CODES = [
  "101",
  "102",
  "103",
  "104",
  "105",
  "106",
  "107",
  "108",
  "109",
  "110",
  "111",
  "112",
  "113",
  "114",
  "115",
  "116",
  "117",
  "118",
  "119",
  "120",
  "121",
  "122",
  "123",
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function parseRent(rentStr: string): number {
  const num = rentStr.replace(/[^0-9]/g, "")
  return num ? parseInt(num, 10) : 0
}

function parseFloorspace(fsStr: string): number {
  // "63&#13217;" or "63㎡" -> 63
  const num = fsStr.match(/\d+/)[0]
  return num ? parseFloat(num) : 0
}

interface ApiBukken {
  shisya: string
  danchi: string
  shikibetu: string
  danchiNm: string
  place: string
  allCount: string
  bukkenCount: string
  room?: ApiRoom[]
}

interface ApiRoom {
  id: string
  roomNmMain: string
  roomNmSub: string
  rent: string
  rent_normal: string
  commonfee: string
  type: string
  floorspace: string
  floor: string
  roomLinkPc: string
  system: Array<{ 制度HTML: string }>
}

function makeBukkenNo(b: ApiBukken): string {
  return `${b.shisya}_${b.danchi}${b.shikibetu}`
}

function mapRoom(bukken: ApiBukken, room: ApiRoom): UrItem {
  return {
    bukkenNo: makeBukkenNo(bukken),
    roomNo: room.id,
    bukkenName: bukken.danchiNm,
    address: bukken.place || "",
    rent: parseRent(room.rent),
    commonfee: parseRent(room.commonfee || "0"),
    layout: room.type,
    floorspace: parseFloorspace(room.floorspace || "0"),
    floor: room.floor || "",
    status: "募集中",
    url: room.roomLinkPc ? BASE_URL + room.roomLinkPc : "",
  }
}

async function fetchArea(skcs: string): Promise<UrItem[]> {
  const items: UrItem[] = []
  let pageIndex = 0
  let totalBukken = Infinity

  while (true) {
    const params = new URLSearchParams({
      mode: "area",
      skcs,
      tdfk: "13",
      block: "kanto",
      orderByField: "0",
      pageSize: String(PAGE_SIZE),
      pageIndex: String(pageIndex),
      sp: "",
      shisya: "",
      danchi: "",
      shikibetu: "",
      pageIndexRoom: "0",
    })

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "ur-alert/1.0 (personal use)",
      },
      body: params.toString(),
    })

    const data: ApiBukken[] | null = await res.json()
    if (!data || data.length === 0) break

    if (pageIndex === 0) {
      totalBukken = parseInt(data[0].bukkenCount, 10) || 0
    }

    for (const bukken of data) {
      if (bukken.room) {
        for (const room of bukken.room) {
          items.push(mapRoom(bukken, room))
        }
      }
    }

    const fetched = (pageIndex + 1) * PAGE_SIZE
    if (fetched >= totalBukken) break

    pageIndex++
    await sleep(DELAY_MS)
  }

  return items
}

async function main() {
  const today = new Date().toISOString().slice(0, 10)
  const dataDir = join(process.cwd(), "data")
  const snapshotsDir = join(dataDir, "snapshots")
  const snapshotFile = join(snapshotsDir, `${today}.json`)

  if (existsSync(snapshotFile)) {
    console.log(`Snapshot already exists: ${snapshotFile}`)
    return
  }

  mkdirSync(snapshotsDir, { recursive: true })

  console.log(
    `Fetching UR properties for Tokyo (${SKCS_CODES.length} areas)...`
  )
  const allItems: UrItem[] = []

  for (const skcs of SKCS_CODES) {
    console.log(`  Fetching area ${skcs}...`)
    const items = await fetchArea(skcs)
    console.log(`    Found ${items.length} rooms`)
    allItems.push(...items)
    if (items.length > 0) {
      await sleep(DELAY_MS)
    }
  }

  // Deduplicate by unit_id (bukkenNo:roomNo)
  const seen = new Set<string>()
  const dedupItems: UrItem[] = []
  for (const item of allItems) {
    const uid = `${item.bukkenNo}:${item.roomNo}`
    if (!seen.has(uid)) {
      seen.add(uid)
      dedupItems.push(item)
    }
  }

  const snapshot: Snapshot = {
    snapshot_date: today,
    items: dedupItems,
  }

  writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2))
  writeFileSync(join(dataDir, "latest.json"), JSON.stringify(snapshot, null, 2))

  console.log(
    `Done! Saved ${dedupItems.length} rooms to ${snapshotFile} and data/latest.json`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
