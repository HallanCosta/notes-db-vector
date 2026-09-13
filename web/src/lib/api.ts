import { backendMode, isSupabaseMode } from "./backend"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321"
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ""
const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8003"

const functionsUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1`

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

  async sendChatMessage({ message, sessionId }: { message: string; sessionId: string }) {
    const response = await fetch(`${apiUrl}/chat`, {
      method: "POST",
      headers: API_CONFIG.getHeaders(),
      body: JSON.stringify({ message, session_id: sessionId }),
    })
    if (!response.ok) throw new Error(`Failed to send chat message: ${response.status}`)
    return response.json()
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
