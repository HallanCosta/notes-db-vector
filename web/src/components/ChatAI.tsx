import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Trash2, MessageSquare } from "lucide-react"
import { API_CONFIG } from "../lib/api"
import { supabase } from "../lib/supabase"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface ChatAIProps {
  sessionId?: string
}

export function ChatAI({ sessionId = "default" }: ChatAIProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Carregar mensagens iniciais
  useEffect(() => {
    loadMessages()
  }, [sessionId])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
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
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
      await API_CONFIG.sendChatMessage({
        message: userMessage,
        sessionId,
      })
      // A resposta da AI chega via Supabase Realtime (INSERT na tabela chat_messages)
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
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h2 className="font-semibold">Chat AI</h2>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Pergunte algo sobre suas notas</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
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
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={sending}
          />
          <Button onClick={handleSendMessage} disabled={!input.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
