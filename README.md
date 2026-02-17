# UR賃貸 空き情報差分監視システム

## 目的

UR賃貸住宅の空き情報を **毎日自動取得** し、前日との差分（新規空き・消失・条件変更）を検出して **通知** する。

- 個人利用
- 無料での長期運用
- 過剰アクセスを避け、安定稼働を最優先

---

## 全体構成（無料）

```
GitHub Actions (cron)
   ↓
Node.js スクリプト
   ↓
UR 内部検索API（POST）
   ↓
JSON（スナップショット保存）
   ↓
前日との差分検出
   ↓
Slack / LINE 通知
```

---

## 使用技術

| 区分     | 技術                 | 理由                        |
| -------- | -------------------- | --------------------------- |
| 実行基盤 | GitHub Actions       | 無料cron・Node.js実行可     |
| 言語     | Node.js / Typescript | 実装容易・安定              |
| HTTP     | requests             | 軽量                        |
| Data     | JSONファイル         | サーバー不要・1ファイル完結 |
| 通知     | Slack Webhook        | 実装が最も簡単              |

---

## データ取得仕様

### 利用API（非公式）

- URL:

  ```
  POST https://chintai.r6.ur-net.go.jp/chintai/api/bukken/result/bukken_result/
  ```

- Content-Type:

  ```
  application/x-www-form-urlencoded; charset=UTF-8
  ```

- 実行頻度: **1日1回**

### 主なリクエストパラメータ

| パラメータ | 内容                      |
| ---------- | ------------------------- |
| block      | 地域（kanto）             |
| tdfk       | 都道府県コード（13=東京） |
| skcs       | 募集種別（101,106）       |
| pageSize   | ページ件数（例:100）      |
| pageIndex  | ページ番号                |

ページングを行い、全件取得する。

---

## データ正規化方針

### 主キー

- `bukkenNo`（物件ID）
- `roomNo`（部屋ID、存在する場合）

```text
(bukkenNo, roomNo) を同一部屋の一意キーとする
```

### 保存対象項目（例）

- bukkenNo
- roomNo
- bukkenName
- rent
- layout
- floorspace
- status

---

## データ保存方式（JSON + Git）

### 方針

**日次スナップショットを JSON ファイルとして保存し、Git の commit 履歴で管理**する。

- DB不要
- 人間が直接中身を確認できる
- GitHub Actions / GitHub Pages と親和性が高い

---

### ディレクトリ構成

```
data/
├── snapshots/
│   ├── 2026-02-12.json
│   ├── 2026-02-13.json
│   └── ...
└── latest.json
```

- `snapshots/YYYY-MM-DD.json`
  - 当日の全物件スナップショット

- `latest.json`
  - 最新日のデータ（フロントエンド・差分計算用）

---

### JSONフォーマット（例）

```json
{
  "snapshot_date": "2026-02-13",
  "items": [
    {
      "bukkenNo": "xxxx",
      "roomNo": "xxx",
      "bukkenName": "○○団地",
      "rent": 120000,
      "layout": "2LDK",
      "floorspace": 55.3,
      "status": "募集中",
      "url": "https://www.ur-net.go.jp/chintai/..."
    }
  ]
}
```

---

### 一意キーの考え方

```text
unit_id = bukkenNo + ":" + roomNo
```

- 差分計算・比較は `unit_id` 単位で行う
- `roomNo` が存在しない場合は `bukkenNo` のみを使用

---

### 保存ルール

- 1日1ファイルのみ生成
- 既存ファイルは上書きしない
- GitHub Actions 実行後に commit & push

---

## 差分検出仕様

### 新規空き

- 今日存在し、昨日存在しない部屋

### 消失（成約・募集終了）

- 昨日存在し、今日存在しない部屋

### 条件変更（任意）

- 家賃変更
- ステータス変更

---

## 通知仕様

### 通知条件（例）

- 家賃 < 150,000円
- 間取り: 2LDK以上
- 面積 >= 50㎡

### 通知内容

- 物件名
- 部屋番号
- 家賃
- 間取り
- URL（詳細ページ）

### 通知手段

- Slack Incoming Webhook

---

## 実行スケジュール

- 実行基盤: GitHub Actions
- 実行時刻: 毎日 7:00 JST

```cron
0 22 * * *  # UTC
```

---

## リポジトリ構成例

```
ur-watch/
├── .github/workflows/daily.yml
├── fetch.py      # API取得・DB保存
├── diff.py       # 差分検出
├── notify.py     # 通知
├── requirements.txt
└── data/
    └── json
```

---

## 永続化方針

- JSON ファイルを GitHub リポジトリに commit
- Git が履歴バックアップを兼ねる

---

## 運用上の注意

- アクセス頻度は 1日1回厳守
- User-Agent を明示
- 再配布・公開サービス化は行わない

---

## フロントエンド公開（GitHub Pages）

### 目的

取得した **最新の物件情報（当日スナップショット）を閲覧できる簡易Webページ** を作成し、GitHub Pages で無料公開する。

- 個人利用・閲覧目的
- 認証なし
- 検索・絞り込みは最小限

---

### 構成

```
GitHub Actions
   ↓
Node.js（最新データ抽出）
   ↓
静的JSON生成
   ↓
静的HTML/JS
   ↓
GitHub Pages
```

---

### データ提供方式

- JSON から **最新日付のデータのみ** 抽出
- 以下のような JSON を生成してリポジトリに配置

```json
{
  "generated_at": "2026-02-13",
  "items": [
    {
      "bukkenNo": "xxxx",
      "roomNo": "xxx",
      "name": "○○団地",
      "rent": 120000,
      "layout": "2LDK",
      "floorspace": 55.3,
      "url": "https://www.ur-net.go.jp/chintai/..."
    }
  ]
}
```

---

### フロントエンド仕様

- 技術: **Next.js**

- 表示内容:
  - 物件名
  - 部屋番号
  - 家賃
  - 間取り
  - 面積
  - 詳細ページへのリンク

- 機能:
  - 家賃・間取りの簡易フィルタ
  - 新着（当日追加）物件の強調表示

---

### GitHub Pages 公開方法

- GitHub Actions から自動更新

```text
/docs
  ├── index.html
  ├── data.json
  └── app.js
```

---

### 注意事項（重要）

- 公開するのは **当日分の最新情報のみ**
- 過去履歴・全量データは公開しない
- 商用利用・再配布を行わない

---

## 将来拡張（想定）

- フィルタ条件の高度化
- 地域・条件の複数切り替え
- 公開ページのUI改善
