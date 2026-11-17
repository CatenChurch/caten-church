# Caten Church

茄典教會網站 <https://caten-church.org/> 的 Cloudflare 重寫版（進行中）。正式站目前仍是 `master` 分支的 Rails 版本，跑在 Heroku。

## 技術

- Cloudflare Workers + [Hono](https://hono.dev/)（JSX 伺服器端渲染）
- D1（SQLite）+ [Drizzle ORM](https://orm.drizzle.team/)
- R2：週報 PDF（`weeklies/<id>.pdf`）
- Vitest（在 Workers 執行環境裡跑，含 D1 與 R2）

## 開發

需要 Node 24 以上與 pnpm。

```sh
pnpm install
pnpm dev        # 套用本機 D1 migrations 後啟動 http://localhost:8787
pnpm test
pnpm typecheck
pnpm format
```

改了 `src/db/schema.ts` 之後執行 `pnpm db:generate` 產生新的 migration。

## 目錄

| 路徑               | 內容                                              |
| ------------------ | ------------------------------------------------- |
| `src/routes/`      | 頁面路由與畫面                                    |
| `src/data/`        | 資料查詢與規則，不含 HTML                         |
| `src/db/schema.ts` | 資料表定義                                        |
| `src/settings.ts`  | 站台設定的預設值；`settings` 表裡的值會覆蓋預設值 |
| `src/views/`       | 共用版面與元件                                    |
| `migrations/`      | D1 migrations（由 Drizzle 產生）                  |
| `scripts/import/`  | 從 Rails 的 Postgres 匯入資料                     |

## 進度

- [x] 公開頁面：首頁、關於我們、聚會與交通、奉獻、隱私條款、週報（含 PDF）
- [x] 從 Heroku 匯入正式資料與 347 份週報 PDF（2026-11-17）
- [x] OAuth 登入與會員中心：個人資料、登入方式（可綁定多種）。Google、LINE 已上線；Facebook 見下方
- [x] 每月 25 號寄下月壽星名單給管理員（SendGrid 金鑰已設定；還沒實際寄過信）
- [x] 後台：會友（搜尋、檢視、編輯、匯出 CSV、設為管理員、合併重複帳號）、週報管理（PDF 上傳到 R2，上限 10 MB）、站台設定（含修改紀錄與 logo、favicon、頁首背景圖上傳）
- [x] `sitemap.xml`、`robots.txt`、Google Search Console 驗證網址
- [x] 正式的 D1 與 R2（亞太區），部署在 https://beta.caten-church.org
- [ ] Facebook 登入：Meta 自 2024-06 起限制此 app 的 API（資料使用情形檢查逾期、商家未驗證），`wrangler.jsonc` 的 `FACEBOOK_LOGIN: "off"` 先隱藏按鈕；恢復後刪掉這個變數再部署
- [ ] 切換 caten-church.org

不重寫的功能：密碼登入、活動（含報名）、小組（含小組回報）、LINE 與 Messenger 聊天機器人。

## 從 Rails 匯入資料

匯出檔含會友個資，`dump/` 與 `import.sql` 已列在 `.gitignore`，用完請刪除。

```sh
# 1. 從 Heroku 匯出（唯讀）：在 Windows 先 `npx heroku login`，再執行
#    （psql 在 WSL 裡；也可以直接 DATABASE_URL=postgres://... scripts/import/export-postgres.sh）
pwsh scripts/import/export-from-heroku.ps1

# 2. 轉成 D1 的 SQL；會列出每張表的筆數與被略過的資料
node scripts/import/build-sql.ts

# 3. 匯入（先用 --local 演練）；已存在的帳號會更新而不是重複新增
pnpm exec wrangler d1 execute DB --local --file import.sql

# 4. 週報 PDF：WSL 裡用 gcloud 下載，再用 wrangler 上傳（逐一核對 MD5）
bash scripts/import/copy-pdfs.sh download
bash scripts/import/copy-pdfs.sh upload
```

`dump/pdf-copies.tsv` 列出每個週報 PDF 要從 GCS 的哪個 key 複製到 R2 的哪個 key（含大小與 MD5）。

匯入時的規則：

- 保留原本的 id，所以 `/weeklies/<id>` 等舊網址不變。
- email 從未驗證、也沒有綁定 Facebook 的帳號不匯入（連同它的個人資料與報名紀錄），並列在略過清單。
- 不匯入的欄位與資料表：密碼與 Devise 相關欄位、`events`、`event_users`、`groups`、`group_users`、`group_reports`、`subscriptions`、`messengers`、Active Storage 的表。

## 部署前要做的事

`wrangler.jsonc` 裡的 D1 `database_id` 是佔位值。部署前需要：

```sh
pnpm exec wrangler d1 create caten-church      # 把回傳的 id 填進 wrangler.jsonc
pnpm exec wrangler r2 bucket create caten-church
pnpm run deploy
```

接著用 `pnpm exec wrangler secret put <名稱>` 設定金鑰（名稱與來源見 `.dev.vars.example`）：

- `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`：callback 是 `https://<網域>/auth/google/callback`
- `LINE_CHANNEL_ID`、`LINE_CHANNEL_SECRET`：callback 是 `https://<網域>/auth/line/callback`
- `FACEBOOK_APP_ID`、`FACEBOOK_APP_SECRET`：要用舊站同一個 Facebook app，舊會友才對得回帳號
- `SENDGRID_API_KEY`：沒有設定就不會寄信

部署後：

- 第一位管理員要直接在資料庫設定：`pnpm exec wrangler d1 execute DB --remote --command "UPDATE users SET is_admin = 1 WHERE email = '<email>'"`（匯入舊資料的話，舊站的管理員會自動帶過來）。
- 到 後台 → 站台設定 填入 Google Analytics 評估 ID（GA4 是 `G-X2MWZF2WGV`）；沒有填就不會載入分析程式。
