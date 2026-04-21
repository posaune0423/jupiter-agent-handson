# STRUCTURE

このリポジトリは、Jupiter Agent Skills を使った handson demo と、その説明用スライドを管理する。

## Top Level

- `docs/`: プロジェクト文書。`PRD.md`、`TECH.md`、`STRUCTURE.md` を置く。
- `examples/`: handson demo 用の独立した Deno project を置く。
- `assets/`: スライドや説明で使う画像・SVG などの素材。
- `theme/`: Marp スライド用テーマ。
- `SLIDE.md`: プレゼン本体。Marp 形式で記述する。
- `output/`: 生成物の出力先。

## examples/ 方針

- 実コードは `examples/<project>/` 以下に集約する。
- 各 project は `deno.json`、`deno.lock`、`.env.example`、`.env.encrypted` を持つ。
- `.env.keys` と `.env` は project ごとに置くが、commit しない。
- `openclaw/`: OpenClaw 連携や demo 用の実装を置く。
- `minimum-api/`: Jupiter API の最小実装を usecase 単位で置く。
- 1 file 1 usecase を基本とする。
- 共通処理が必要になった場合のみ分離する。

## docs/ 方針

- `PRD.md`: 目的とイベント文脈。
- `TECH.md`: 使用技術と実装方針。
- `STRUCTURE.md`: ディレクトリ構成と配置ルール。
