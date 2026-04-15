import { DefaultDeepgramClient } from "@deepgram/sdk";
export const deepgram = new DefaultDeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY! });
