import { readFileSync, existsSync } from "fs"
import { join } from "path"
import type { DiffResult, DiffEntry } from "./types"

const LARGE_LAYOUTS = new Set([
  "2LDK",
  "3K",
  "3DK",
  "3LDK",
  "4K",
  "4DK",
  "4LDK",
  "5K",
  "5DK",
  "5LDK",
  "6LDK",
])

function matchesFilter(entry: DiffEntry): boolean {
  const item = entry.item
  if (item.rent >= 150000) return false
  if (!LARGE_LAYOUTS.has(item.layout)) return false
  if (item.floorspace < 50) return false
  return true
}

function formatRent(rent: number): string {
  return rent.toLocaleString() + "円"
}

async function main() {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.log("SLACK_WEBHOOK_URL not set, skipping notification.")
    return
  }

  const diffFile = join(process.cwd(), "data", "diff.json")
  if (!existsSync(diffFile)) {
    console.log("No diff.json found, skipping notification.")
    return
  }

  const diff: DiffResult = JSON.parse(readFileSync(diffFile, "utf-8"))
  const newEntries = diff.entries
    .filter((e) => e.type === "new")
    .filter(matchesFilter)

  if (newEntries.length === 0) {
    console.log("No matching new properties found, skipping notification.")
    return
  }

  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `UR新着物件 ${diff.diff_date} (${newEntries.length}件)`,
      },
    },
  ]

  for (const entry of newEntries.slice(0, 20)) {
    const item = entry.item
    blocks.push(
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `*${item.bukkenName}* ${item.roomNo}`,
            `家賃: *${formatRent(item.rent)}* (共益費: ${formatRent(item.commonfee)})`,
            `間取り: ${item.layout} / 面積: ${item.floorspace}㎡ / ${item.floor}`,
            item.url ? `<${item.url}|詳細を見る>` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      }
    )
  }

  if (newEntries.length > 20) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `他 ${newEntries.length - 20}件`,
        },
      ],
    })
  }

  // Summary of all changes
  const summary = [
    `新規: ${diff.entries.filter((e) => e.type === "new").length}件`,
    `消失: ${diff.entries.filter((e) => e.type === "removed").length}件`,
    `家賃変更: ${diff.entries.filter((e) => e.type === "rent_changed").length}件`,
  ].join(" / ")

  blocks.push(
    { type: "divider" },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `全体: ${summary}` }],
    }
  )

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  })

  if (res.ok) {
    console.log("Slack notification sent successfully.")
  } else {
    console.error(`Slack notification failed: ${res.status} ${await res.text()}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
