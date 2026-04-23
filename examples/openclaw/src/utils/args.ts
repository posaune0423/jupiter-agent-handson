import { ValidationError } from "./errors.ts";

export type ParsedArgs = Record<string, string>;

export function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      throw new ValidationError(`Unexpected positional argument: ${arg}`);
    }

    const withoutPrefix = arg.slice(2);
    const eqIdx = withoutPrefix.indexOf("=");
    const rawKey = eqIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, eqIdx);
    const inlineValue = eqIdx === -1
      ? undefined
      : withoutPrefix.slice(eqIdx + 1);

    if (!rawKey) {
      throw new ValidationError("Empty option name is not allowed");
    }

    if (inlineValue !== undefined) {
      parsed[rawKey] = inlineValue;
      continue;
    }

    const next = args[index + 1];
    if (next === undefined || next.startsWith("--")) {
      parsed[rawKey] = "true";
      continue;
    }

    parsed[rawKey] = next;
    index++;
  }

  return parsed;
}

export function getStringArg(
  args: ParsedArgs,
  key: string,
): string | undefined {
  return args[key];
}

export function getBooleanArg(args: ParsedArgs, key: string): boolean {
  return args[key] === "true";
}

export function getIntegerArg(
  args: ParsedArgs,
  key: string,
): number | undefined {
  const value = args[key];
  if (value === undefined) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new ValidationError(`--${key} must be an integer`);
  }

  return parsed;
}
