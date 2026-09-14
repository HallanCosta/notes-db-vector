import { backendMode, isSupabaseMode } from "./backend"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321"
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ""
const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8003"
const CHAT_REQUEST_TIMEOUT_MS = 30_000

const functionsUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1`

export interface ChatMessageResponse {
  role: "user" | "assistant"
  content: string
}

export interface ChatResponse {
  user_message: ChatMessageResponse
  assistant_message: ChatMessageResponse
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function isChatMessage(value: unknown): value is ChatMessageResponse {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  )
}

function isChatResponse(value: unknown): value is ChatResponse {
  if (!value || typeof value !== "object") return false
  const response = value as Record<string, unknown>
  return isChatMessage(response.user_message) && isChatMessage(response.assistant_message)
}

export const API_CONFIG = {
  mode: backendMode,
  functionsUrl,
  apiUrl,

  getHeaders: (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (isSupabaseMode) {
      headers.apikey = supabaseKey
      headers.Authorization = `Bearer ${supabaseKey}`
    }
    return headers
  },

  async getNotes() {
    const url = isSupabaseMode ? `${functionsUrl}/get-notes` : `${apiUrl}/notes`
    const response = await fetch(url, {
      headers: API_CONFIG.getHeaders(),
    })
    if (!response.ok) throw new Error(`Failed to fetch notes: ${response.status}`)
    return response.json()
  },

  async createNote(note: { title: string; content: string }) {
    const url = isSupabaseMode ? `${functionsUrl}/create-note` : `${apiUrl}/notes`
    const response = await fetch(url, {
      method: "POST",
      headers: API_CONFIG.getHeaders(),
      body: JSON.stringify(note),
    })
    if (!response.ok) throw new Error(`Failed to create note: ${response.status}`)
    return response.json()
  },

  async searchNotes({ query }: { query: string }) {
    const url = isSupabaseMode
      ? `${functionsUrl}/search-notes?q=${encodeURIComponent(query)}`
      : `${apiUrl}/notes/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: API_CONFIG.getHeaders(),
    })
    if (!response.ok) throw new Error(`Failed to search notes: ${response.status}`)
    return response.json()
  },

  async getChatMessages({ sessionId, limit = 50 }: { sessionId: string; limit?: number }) {
    const params = new URLSearchParams({ session_id: sessionId, limit: String(limit) })
    const response = await fetch(`${apiUrl}/chat/messages?${params.toString()}`, {
      headers: API_CONFIG.getHeaders(),
    })
    if (!response.ok) throw new Error(`Failed to fetch chat messages: ${response.status}`)
    return response.json()
  },

  async sendChatMessage({ message, sessionId }: { message: string; sessionId: string }): Promise<ChatResponse> {
    const response = await fetchWithTimeout(`${apiUrl}/chat`, {
      method: "POST",
      headers: API_CONFIG.getHeaders(),
      body: JSON.stringify({ message, session_id: sessionId }),
    }, CHAT_REQUEST_TIMEOUT_MS)
    if (!response.ok) throw new Error(`Failed to send chat message: ${response.status}`)
    const data: unknown = await response.json()
    if (!isChatResponse(data)) throw new Error("Invalid chat response")
    return data
  },

  async clearChat({ sessionId }: { sessionId: string }) {
    const params = new URLSearchParams({ session_id: sessionId })
    const response = await fetch(`${apiUrl}/chat/messages?${params.toString()}`, {
      method: "DELETE",
      headers: API_CONFIG.getHeaders(),
    })
    if (!response.ok) throw new Error(`Failed to clear chat: ${response.status}`)
    return response.json()
  },
}
