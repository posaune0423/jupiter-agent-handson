# TECH

## Stack

- Runtime: Deno
- Language: TypeScript
- Slides: Marp
- Theme: `theme/jupiter.css`
- Reference skill: [`jup-ag/agent-skills`](https://github.com/jup-ag/agent-skills)

## Implementation Policy

- handson demo で使うスクリプトを TypeScript で実装する。
- 実装は `examples/<project>/` 以下に usecase 単位で配置する。
- Deno の設定と lock file は example project ごとに管理する。
- 環境変数は project ごとの `.env.example` を source of truth とする。
- デモコードは最小構成を優先し、不要な抽象化は避ける。
- Deno を前提に実行し、Node.js 向けの前提は置かない。

## Documentation Policy

- プレゼン内容は `SLIDE.md` に Marp 形式で記述する。
- 技術判断は `docs/TECH.md`、構成判断は `docs/STRUCTURE.md` に集約する。
