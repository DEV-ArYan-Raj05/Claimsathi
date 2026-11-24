import type { ChatReply, ChatRequestBody, VoiceIntent } from "@/shared/api/contract";
import type { Track } from "@/shared/config/app";
import { api, liveApi } from "@/shared/lib/apiClient";

/** POST /voice/intent — text in, intent + reply + where to go out (demo keyword assistant). */
export const getIntent = (text: string, track: Track, lang: string) =>
  api<VoiceIntent>("POST", "/voice/intent", { text, track, lang });

/** POST /api/v1/chat — the Sarvam-backed assistant on FastAPI (needs a Supabase session). */
export const sendChatMessage = (body: ChatRequestBody) => liveApi<ChatReply>("POST", "/chat", body);
