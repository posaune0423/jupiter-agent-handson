# STRUCTURE

このリポジトリは、Jupiter Agent Skills を使った handson demo と、その説明用スライドを管理する。

## Top Level

- `docs/`: プロジェクト文書。`PRD.md`、`TECH.md`、`STRUCTURE.md` を置く。
- `scripts/`: handson demo 用の TypeScript 実装を置く。usecase 単位で分割する。
- `assets/`: スライドや説明で使う画像・SVG などの素材。
- `theme/`: Marp スライド用テーマ。
- `SLIDE.md`: プレゼン本体。Marp 形式で記述する。
- `output/`: 生成物の出力先。
- `deno.json`: Deno の設定。
- `deno.lock`: Deno の lock file。

## scripts/ 方針

- 実コードは `scripts/` 以下に集約する。
- 1 ファイル 1 usecase を基本とする。
- 共通処理が必要になった場合のみ分離する。

## docs/ 方針

- `PRD.md`: 目的とイベント文脈。
- `TECH.md`: 使用技術と実装方針。
- `STRUCTURE.md`: ディレクトリ構成と配置ルール。
