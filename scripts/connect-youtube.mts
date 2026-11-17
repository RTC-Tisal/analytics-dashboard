// ONE-TIME: connect the Rootcode YouTube channel and save a refresh token.
//
// Run:  node --env-file=.env.local scripts/connect-youtube.mts
//
// What happens:
//   1. A tiny web server starts on this Mac (127.0.0.1, a random free port).
//   2. The script prints a Google sign-in link. Open it in a PRIVATE window on THIS Mac
//      (the reply comes back to 127.0.0.1, so a phone or another computer won't work).
//   3. The channel owner signs in, picks the Rootcode channel if asked, and approves.
//   4. Google sends a one-time code to our tiny server; we trade it for tokens.
//   5. The refresh token is written to .env.local as YOUTUBE_REFRESH_TOKEN. Never printed.
//
// Read-only access only: we ask for youtube.readonly and yt-analytics.readonly.
// Re-running replaces the saved token (the old one keeps working until Google expires it
// or the owner removes access at myaccount.google.com/permissions).

import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { OAuth2Client } from "google-auth-library";
import { requireEnv } from "./lib/env.mts";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly", // channel and video details
  "https://www.googleapis.com/auth/yt-analytics.readonly", // views, watch time, subscribers
];
const ENV_FILE = ".env.local";
const TOKEN_NAME = "YOUTUBE_REFRESH_TOKEN";
const WAIT_MINUTES = 5;

const clientId = requireEnv("YOUTUBE_CLIENT_ID");
const clientSecret = requireEnv("YOUTUBE_CLIENT_SECRET");

// 1. Start the tiny server first, so we know which port to tell Google about.
const server = createServer();
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address() as AddressInfo;
const redirectUri = `http://127.0.0.1:${port}`;

const client = new OAuth2Client({ clientId, clientSecret, redirectUri });

// PKCE: a secret only this run knows, so a stolen code alone is useless.
const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
// state: a random value; we only accept replies that bring it back unchanged.
const state = randomBytes(16).toString("hex");

const signInUrl = client.generateAuthUrl({
  scope: SCOPES,
  access_type: "offline", // gives us a refresh token
  prompt: "consent", // always show the approval screen, so Google always sends one
  state,
  code_challenge: codeChallenge,
  code_challenge_method: "S256" as never, // the library's enum type; "S256" is the standard value
});

console.log("\nOpen this link in a private window on this Mac and sign in as the channel owner:\n");
console.log(signInUrl);
console.log(`\nWaiting up to ${WAIT_MINUTES} minutes for approval…`);

// 2. Wait for Google to send the browser back to us with a code (or an error).
let code: string;
try {
  code = await waitForCode();
} finally {
  server.close();
}

// 3. Trade the code for tokens.
const { tokens } = await client.getToken({ code, codeVerifier, redirect_uri: redirectUri });
if (!tokens.refresh_token) {
  throw new Error(
    "Google didn't send a refresh token. Remove the app's access at " +
      "myaccount.google.com/permissions (as the channel owner) and run this again.",
  );
}

// 4. Save it to .env.local without printing it.
saveToEnvFile(TOKEN_NAME, tokens.refresh_token);
console.log(`\nSaved ${TOKEN_NAME} to ${ENV_FILE}.`);

// 5. Check it works by asking which channel we're connected to (the name is public).
client.setCredentials(tokens);
try {
  const res = await client.request<{ items?: { snippet: { title: string } }[] }>({
    url: "https://www.googleapis.com/youtube/v3/channels",
    params: { part: "snippet", mine: true },
  });
  const channels = res.data.items ?? [];
  if (channels.length === 0) {
    console.log("Warning: this account has no YouTube channel. Was the right channel picked?");
  } else {
    console.log(`Connected to channel: ${channels.map((c) => c.snippet.title).join(", ")}`);
  }
} catch (error) {
  // The token is already saved; this only means the check itself failed.
  const message = error instanceof Error ? error.message : String(error);
  console.log(`Token saved, but the channel check failed: ${message}`);
  console.log("Is the YouTube Data API v3 enabled in the Google Cloud project?");
}

// ---------------------------------------------------------------------------

function waitForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`No approval within ${WAIT_MINUTES} minutes. Run the script again.`)),
      WAIT_MINUTES * 60_000,
    );

    server.on("request", (req, res) => {
      const url = new URL(req.url ?? "/", redirectUri);
      if (url.pathname !== "/") {
        res.writeHead(404).end(); // e.g. the browser asking for /favicon.ico
        return;
      }

      const reply = (status: number, message: string) =>
        res
          .writeHead(status, { "Content-Type": "text/html; charset=utf-8" })
          .end(`<p style="font-family:sans-serif">${message}</p>`);

      if (url.searchParams.get("state") !== state) {
        reply(400, "This reply wasn't expected. Close this window.");
        return; // keep waiting for the real one
      }

      clearTimeout(timer);
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      if (error || !code) {
        reply(400, "Access wasn't approved. You can close this window.");
        reject(new Error(`Google sign-in didn't finish: ${error ?? "no code"}`));
        return;
      }
      reply(200, "Done. You can close this window and go back to the terminal.");
      resolve(code);
    });
  });
}

// Replace the NAME=… line in .env.local, or add it at the end. Other lines stay as they are.
function saveToEnvFile(name: string, value: string) {
  const original = readFileSync(ENV_FILE, "utf8");
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  const updated = pattern.test(original)
    ? original.replace(pattern, () => line)
    : `${original}${original.endsWith("\n") || original === "" ? "" : "\n"}${line}\n`;
  writeFileSync(ENV_FILE, updated);
}
