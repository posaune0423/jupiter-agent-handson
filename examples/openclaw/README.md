# OpenClaw Jupiter Demo Workspace

[OpenClaw](https://docs.openclaw.ai/) の Agent Workspace テンプレート兼 Jupiter ハンズオン用デモ。

参加者がそのまま `~/.openclaw/workspace` にコピーし、OpenClaw から Swap / Lend / DCA の最小フローを実行できる構成。

## ファイル構成

```
examples/openclaw/
├── AGENTS.md        # Agent の動作指示・ワークスペースルール
├── SOUL.md          # ペルソナ・トーン・境界
├── USER.md          # ユーザー情報（初回セッションで埋める）
├── IDENTITY.md      # Agent のアイデンティティ（初回セッションで埋める）
├── TOOLS.md         # ローカル環境固有のメモ
├── HEARTBEAT.md     # 定期チェックタスク（空 = スキップ）
├── BOOTSTRAP.md     # 初回起動リチュアル（完了後に削除）
├── memory/          # daily memory ログ（memory/YYYY-MM-DD.md）
├── scripts/         # OpenClaw から呼ぶ Jupiter demo scripts
├── src/commands/    # CLI arg parse, output formatting, error display
├── src/usecases/    # swap / lend / dca / wallet / report の本体
├── src/lib/jupiter/ # Jupiter API wrapper
├── src/lib/solana/  # wallet, signing, RPC, transaction confirm
├── src/config/      # workshop demo defaults
├── src/utils/       # env, args, token, amount, retry, error helpers
├── deno.json        # Deno プロジェクト設定
└── .env.encrypted   # 暗号化済み環境変数
```

## セットアップ

### 1. OpenClaw Workspace としてコピー

```sh
cp -r examples/openclaw/ ~/.openclaw/workspace
```

### 2. 環境変数の復号（必要な場合）

```sh
cd ~/.openclaw/workspace
dotenvx decrypt
```

`.env.keys` は秘密情報なのでコミットしない。必要な環境変数は `.env.encrypted` に定義済み。

- `JUPITER_API_KEY`: [portal.jup.ag](https://portal.jup.ag) で発行した API key
- `PRIVATE_KEY`: base58 文字列または JSON 配列形式の Solana secret key
- `SOLANA_RPC_URL`: 省略時は `https://api.mainnet-beta.solana.com`

### 3. Demo tasks

すべて `dotenvx run -f .env.encrypted --strict -- deno run --allow-env --allow-net ...` 経由で実行される。

```sh
deno task wallet
deno task swap
deno task lend
deno task dca
deno task report
```

通常タスクは transaction を取得するだけ。署名・送信は明示的な execute task だけで行う。

```sh
deno task swap:execute
deno task lend:execute
deno task dca:execute
```

Workshop-safe defaults:

- Swap: `0.001 SOL -> USDC`
- Lend: `1 USDC` Earn deposit
- DCA/Recurring: `104 USDC -> SOL`, `2` orders, `86400` seconds interval

DCA/Recurring は Jupiter の最小条件に合わせ、合計 `100 USD` 以上、`2` orders 以上、1 order あたり `50 USD` 以上になる値を使う。

### 4. 初回セッション

OpenClaw Gateway を起動すると `BOOTSTRAP.md` に従って Agent が自己紹介を開始する。
`IDENTITY.md` と `USER.md` が埋まったら `BOOTSTRAP.md` を削除する。

## 参考

- [Agent Workspace](https://docs.openclaw.ai/concepts/agent-workspace)
- [SOUL.md Personality Guide](https://docs.openclaw.ai/concepts/soul)
- [Memory Overview](https://docs.openclaw.ai/concepts/memory)
