/** x-10 assistant: conversation, loading, errors, language choice and per-user isolation. */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@/shared/i18n";
import { ApiError } from "@/shared/lib/apiClient";
import { useSession } from "@/shared/lib/session";
import { useAssistantStore } from "../store";
import { VoiceSheet } from "./VoiceSheet";

const live = vi.hoisted(() => ({ on: true }));
vi.mock("@/shared/config/app", async (orig) => ({
  ...(await orig<typeof import("@/shared/config/app")>()),
  get IS_LIVE_CHAT() {
    return live.on;
  },
}));
const api = vi.hoisted(() => ({ sendChatMessage: vi.fn(), getIntent: vi.fn() }));
vi.mock("../api", () => api);

function renderSheet() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/health"]}>
        <VoiceSheet isOpen onClose={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const reply = (text: string, extra: object = {}) => ({
  conversation_id: "conv_abcdefghijklmnopqrstu",
  reply: text,
  reply_en: text,
  language: "en-IN",
  translated: false,
  intent: "unknown",
  route: null,
  ...extra,
});

function ask(text: string) {
  fireEvent.change(screen.getByLabelText("Or type your question"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
}

beforeEach(() => {
  live.on = true;
  api.sendChatMessage.mockReset();
  api.getIntent.mockReset();
  useSession.setState({ user: { id: "user-a", email: null }, isSignedIn: true, isReady: true });
  useAssistantStore.setState({
    messages: [],
    conversationId: null,
    ownerId: "user-a",
    chatLanguage: null,
  });
});
afterEach(cleanup);

describe("VoiceSheet with the live assistant", () => {
  it("shows the question, a thinking state, then the answer, and keeps the conversation", async () => {
    let resolve: (v: unknown) => void = () => undefined;
    api.sendChatMessage.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    renderSheet();
    expect(screen.getByText("Try saying")).toBeTruthy(); // empty state shows suggestions
    ask("Which documents do I need?");
    expect(screen.getByText("Which documents do I need?")).toBeTruthy();
    expect(screen.getByText("Thinking…")).toBeTruthy();
    await act(async () => resolve(reply("Upload the signed claim form.")));
    expect(await screen.findByText("Upload the signed claim form.")).toBeTruthy();
    expect(screen.queryByText("Try saying")).toBeNull();

    api.sendChatMessage.mockResolvedValueOnce(reply("Within 48 hours."));
    ask("By when?");
    await screen.findByText("Within 48 hours.");
    expect(api.sendChatMessage).toHaveBeenLastCalledWith({
      message: "By when?",
      language: "en-IN",
      track: "health",
      conversation_id: "conv_abcdefghijklmnopqrstu",
    });
  });

  it("sends the chosen language and remembers it", async () => {
    api.sendChatMessage.mockResolvedValue(reply("தமிழ் பதில்", { language: "ta-IN" }));
    renderSheet();
    fireEvent.change(screen.getByLabelText("Reply in"), { target: { value: "ta-IN" } });
    ask("help");
    const answer = await screen.findByText("தமிழ் பதில்");
    expect(answer.getAttribute("lang")).toBe("ta-IN");
    expect(api.sendChatMessage.mock.calls[0]?.[0]).toMatchObject({ language: "ta-IN" });
    expect(localStorage.getItem("cs.chatLang")).toBe("ta-IN");
  });

  it("explains errors with their code and can retry", async () => {
    api.sendChatMessage.mockRejectedValueOnce(new ApiError("CHAT_RATE_LIMITED", "x", 429));
    renderSheet();
    ask("hello");
    expect(await screen.findByText(/Too many questions at once/)).toBeTruthy();
    expect(screen.getByText("Error code: CHAT_RATE_LIMITED")).toBeTruthy();
    api.sendChatMessage.mockResolvedValueOnce(reply("Hi there."));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Hi there.")).toBeTruthy();
  });

  it("says when the backend can't be reached", async () => {
    api.sendChatMessage.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderSheet();
    ask("hello");
    expect(await screen.findByText(/Is the backend running/)).toBeTruthy();
  });

  it("starts a new conversation if the server forgot the old one", async () => {
    useAssistantStore.setState({ conversationId: "conv_oldoldoldoldoldoldold" });
    api.sendChatMessage
      .mockRejectedValueOnce(new ApiError("CONVERSATION_NOT_FOUND", "x", 404))
      .mockResolvedValueOnce(reply("Fresh answer."));
    renderSheet();
    ask("again");
    await screen.findByText("Fresh answer.");
    expect(api.sendChatMessage.mock.calls[1]?.[0]).toMatchObject({ conversation_id: null });
  });

  it("never shows one user's conversation to the next user", async () => {
    api.sendChatMessage.mockResolvedValue(reply("Private answer."));
    renderSheet();
    ask("my question");
    await screen.findByText("Private answer.");
    act(() => useSession.setState({ user: { id: "user-b", email: null } }));
    await waitFor(() => expect(screen.queryByText("Private answer.")).toBeNull());
    expect(useAssistantStore.getState()).toMatchObject({ conversationId: null, ownerId: "user-b" });
  });
});

describe("VoiceSheet without the backend (demo)", () => {
  it("answers from the demo assistant and offers 'Take me there'", async () => {
    live.on = false;
    api.getIntent.mockResolvedValueOnce({
      intent: "start_claim",
      route: "/health/claims/new",
      reply: { en: "Let's start a new claim.", hi: "चलिए नया क्लेम शुरू करते हैं।" },
    });
    renderSheet();
    ask("Start a claim");
    expect(await screen.findByText("Let's start a new claim.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Take me there" })).toBeTruthy();
    expect(screen.getByText(/Demo answers/)).toBeTruthy();
    expect(api.sendChatMessage).not.toHaveBeenCalled();
  });
});
