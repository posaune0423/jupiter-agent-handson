# TOOLS.md - Local Notes

Skills define how tools work. This file is for your specifics — the stuff that's unique to your setup.

## Jupiter Demo Commands

Run commands from this directory.

```sh
deno task wallet
deno task swap
deno task lend
deno task dca
deno task report
```

Execution tasks sign or submit real transactions. Use only after explicit confirmation.

```sh
deno task swap:execute
deno task lend:execute
deno task dca:execute
```

All tasks load encrypted environment variables with dotenvx strict mode and run Deno with `--allow-env --allow-net`.

## Environment

- Required: `JUPITER_API_KEY`, `PRIVATE_KEY`
- Optional: `SOLANA_RPC_URL`
- Source: `.env.encrypted`
- Do not print, paste, or commit `.env.keys`.

## Recurring Checks

Use `deno task report` for a quick Markdown status report. It is safe for cron because it only reads wallet balances and demo defaults.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
