// Read a setting from the environment (.env.local), or stop with a clear message if it's missing.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env.local (see .env.example).`);
  }
  return value;
}

// true when the script was run with --apply. Without it, scripts only show what they would do.
export const isApply = process.argv.includes("--apply");
