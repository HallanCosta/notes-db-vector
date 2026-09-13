import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles, Trash2 } from "lucide-react"
import { API_CONFIG } from "../lib/api"
import { supabase } from "../lib/supabase"
import { isSupabaseMode } from "../lib/backend"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface ChatAIProps {
  sessionId?: string
  noteCount?: number
}

const suggestedPrompts = [
  { icon: "✦", label: "Summarize my latest notes" },
  { icon: "⌁", label: "What ideas connect across my notes?" },
  { icon: "↗", label: "Help me turn a note into a plan" },
]

export function ChatAI({ sessionId = "default", noteCount = 0 }: ChatAIProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Carregar mensagens iniciais
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true)
      try {
        const data = await API_CONFIG.getChatMessages({ sessionId })
        const messagesArray = Array.isArray(data) ? data : []
        setMessages(messagesArray)
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [sessionId])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!isSupabaseMode || !supabase) return

    const client = supabase
    const channel = client
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => {
            // Evita duplicata de mensagem temporária do usuário
            const hasDuplicate = prev.some(
              (m) => m.role === newMsg.role && m.content === newMsg.content && m.id.startsWith("temp-")
            )
            if (hasDuplicate) {
              return prev.map((m) =>
                m.id.startsWith("temp-") && m.role === newMsg.role && m.content === newMsg.content
                  ? newMsg
                  : m
              )
            }
            // Evita duplicata do assistente (já adicionado via resposta da API)
            const alreadyExists = prev.some((m) => m.id === newMsg.id)
            if (alreadyExists) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [sessionId])

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput("")
    setSending(true)

    // Adiciona mensagem do usuário localmente (otimistic update)
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const response = await API_CONFIG.sendChatMessage({
        message: userMessage,
        sessionId,
      })

      // No modo FastAPI não existe Supabase Realtime: a resposta vem no próprio HTTP.
      if (!isSupabaseMode || !supabase) {
        const now = Date.now()
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMessage.id),
          {
            id: `user-${now}`,
            role: "user",
            content: response.user_message.content,
            created_at: new Date(now).toISOString(),
          },
          {
            id: `assistant-${now}`,
            role: "assistant",
            content: response.assistant_message.content,
            created_at: new Date(now).toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      // Remove mensagem temporária em caso de erro
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id))
    } finally {
      setSending(false)
    }
  }

  const handleClearChat = async () => {
    try {
      await API_CONFIG.clearChat({ sessionId })
      setMessages([])
    } catch (error) {
      console.error("Erro ao limpar chat:", error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="notes-chat-root">
      {/* Header */}
      <div className="notes-chat-header">
        <div className="notes-chat-brand">
          <div className="notes-chat-icon">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-semibold tracking-[-0.02em]">Chat AI</h2>
        </div>
        <div className="notes-chat-header-actions">
          <span className="notes-chat-meta">Local workspace · {noteCount} {noteCount === 1 ? "note" : "notes"}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            title="Limpar chat"
            className="notes-chat-clear"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="notes-chat-messages">
        {loading ? (
          <div className="notes-chat-loading">
            <div className="notes-chat-typing">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="animate-bounce"
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "var(--muted-foreground)",
                    animationDelay: `${delay}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="notes-chat-empty">
            <div className="notes-chat-empty-icon">
              <Sparkles className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
              Ask anything about your notes
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with a prompt below or ask in your own words.
            </p>
            <div className="notes-chat-prompts">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => setInput(prompt.label)}
                  className="notes-chat-prompt"
                >
                  <span>{prompt.icon}</span>
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="notes-chat-thread">
            <div className="notes-chat-date">Conversation</div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`notes-chat-message ${message.role === "user" ? "notes-chat-message--user" : "notes-chat-message--assistant"}`}
              >
                <div className="notes-chat-message-avatar">
                  {message.role === "user" ? "HC" : <Sparkles className="h-3.5 w-3.5" />}
                </div>
                <div
                  className="notes-chat-message-body"
                >
                  <div className="notes-chat-message-label">
                    {message.role === "user" ? "You" : "Notes AI · grounded in your workspace"}
                  </div>
                  <div className="notes-chat-bubble">
                    <p>{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {sending && (
          <div className="notes-chat-message notes-chat-message--assistant">
            <div className="notes-chat-message-avatar"><Sparkles className="h-3.5 w-3.5" /></div>
            <div className="notes-chat-typing">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="animate-bounce"
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "var(--muted-foreground)",
                    animationDelay: `${delay}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="notes-chat-input-area">
        <div className="notes-chat-input">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your notes..."
            className="notes-chat-textarea"
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!input.trim() || sending}
            className="notes-chat-send h-9 w-9 shrink-0 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
