import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY not set in server env" },
      { status: 500 }
    );
  }

  // Validate the key against Deepgram's management API before returning it.
  // If the key is invalid/revoked we catch it here instead of the client silently
  // timing out on the WebSocket handshake.
  try {
    const res = await fetch("https://api.deepgram.com/v1/projects", {
      headers: { Authorization: `Token ${key}` },
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[deepgram/token] key validation failed:", res.status, body);
      return NextResponse.json(
        { error: `Deepgram key invalid (${res.status}): ${body.slice(0, 200)}` },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[deepgram/token] validation request failed:", err);
    return NextResponse.json(
      { error: `Cannot reach Deepgram API: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ key });
}
