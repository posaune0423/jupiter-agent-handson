# OpenClaw Agent Workspace

[OpenClaw](https://docs.openclaw.ai/) の Agent Workspace テンプレート。

ハンズオン参加者がそのまま `~/.openclaw/workspace` にコピーして使える最小構成。

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

### 3. 初回セッション

OpenClaw Gateway を起動すると `BOOTSTRAP.md` に従って Agent が自己紹介を開始する。
`IDENTITY.md` と `USER.md` が埋まったら `BOOTSTRAP.md` を削除する。

## 参考

- [Agent Workspace](https://docs.openclaw.ai/concepts/agent-workspace)
- [SOUL.md Personality Guide](https://docs.openclaw.ai/concepts/soul)
- [Memory Overview](https://docs.openclaw.ai/concepts/memory)
