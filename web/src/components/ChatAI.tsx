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
}

const suggestedPrompts = [
  { icon: "✦", label: "Summarize my latest notes" },
  { icon: "⌁", label: "What ideas connect across my notes?" },
  { icon: "↗", label: "Help me turn a note into a plan" },
]

export function ChatAI({ sessionId = "default" }: ChatAIProps) {
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-md shadow-violet-700/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-semibold tracking-[-0.02em]">Chat AI</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          title="Limpar chat"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_44%,#fbfaff,#fff_48%)] p-5">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-1.5">
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
          <div className="mx-auto flex max-w-2xl flex-col items-center py-8 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-violet-400 to-violet-700 text-white shadow-lg shadow-violet-700/25">
              <Sparkles className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
              Ask anything about your notes
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with a prompt below or ask in your own words.
            </p>
            <div className="mt-5 grid w-full gap-2 sm:grid-cols-3">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => setInput(prompt.label)}
                  className="min-h-16 rounded-xl border border-violet-100 bg-white px-3 py-3 text-left text-xs leading-5 text-slate-600 shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50"
                >
                  <span className="mb-1.5 block text-base text-violet-600">{prompt.icon}</span>
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-white shadow-sm ring-1 ring-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-1.5">
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
      <div className="border-t bg-white p-4">
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your notes..."
            className="min-h-[42px] max-h-32 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!input.trim() || sending}
            className="h-9 w-9 shrink-0 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
