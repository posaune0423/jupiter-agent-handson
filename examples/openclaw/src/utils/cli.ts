export type ParsedArgs = Record<string, string>;

export function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }

    const withoutPrefix = arg.slice(2);
    const eqIdx = withoutPrefix.indexOf("=");
    const rawKey = eqIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, eqIdx);
    const inlineValue = eqIdx === -1
      ? undefined
      : withoutPrefix.slice(eqIdx + 1);
    if (!rawKey) throw new Error("Empty option name is not allowed");

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

export function getArg(
  args: ParsedArgs,
  key: string,
  defaultValue: string,
): string {
  return args[key] ?? defaultValue;
}

export function getBooleanArg(args: ParsedArgs, key: string): boolean {
  return args[key] === "true";
}
