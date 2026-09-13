import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowRight,
  BookOpen,
  FilePlus2,
  Loader2,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Sparkles,
  StickyNote,
} from "lucide-react"
import { API_CONFIG } from "./lib/api"
import { ChatAI } from "./components/ChatAI"

interface Note {
  id: string
  title: string
  content: string
  created_at: string
}

interface EmptyStateProps {
  onCreate: () => void
}

function NotesEmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="notes-empty-state">
      <div className="notes-empty-mark" aria-hidden="true">
        <div className="notes-empty-sheet notes-empty-sheet--back" />
        <div className="notes-empty-sheet notes-empty-sheet--middle" />
        <div className="notes-empty-sheet notes-empty-sheet--front">
          <span />
          <span />
        </div>
        <b>✦</b>
      </div>
      <h3>Your knowledge base starts here</h3>
      <p>
        Capture an idea, save a reference, or write down what you learned. Your
        notes will become searchable and ready for AI.
      </p>
      <Button onClick={onCreate} className="notes-secondary-button">
        <FilePlus2 className="h-4 w-4" />
        Create your first note
      </Button>
    </div>
  )
}

interface SearchEmptyStateProps {
  query: string
  onClear: () => void
  onCreate: () => void
}

function SearchEmptyState({ query, onClear, onCreate }: SearchEmptyStateProps) {
  return (
    <div className="notes-empty-state notes-empty-state--search">
      <div className="notes-search-empty-icon" aria-hidden="true">
        <SearchX className="h-8 w-8" />
      </div>
      <h3>Nothing matched this search</h3>
      <p>
        No notes found for <strong>“{query}”</strong>. Try a broader phrase, clear
        the search, or create a new note.
      </p>
      <div className="notes-empty-actions">
        <Button variant="outline" onClick={onClear} className="notes-outline-button">
          <RotateCcw className="h-3.5 w-3.5" />
          Clear search
        </Button>
        <Button variant="outline" onClick={onCreate} className="notes-outline-button">
          <Plus className="h-3.5 w-3.5" />
          Create a note
        </Button>
      </div>
    </div>
  )
}

function getNotePresentation(note: Note, index: number) {
  const text = `${note.title} ${note.content}`.toLowerCase()

  if (/pix|boleto|ted|pagamento|finance|banco|transfer/.test(text)) {
    return { label: "Payments", accent: "terracotta" }
  }
  if (/receita|massa|feijoada|carbonara|pizza|sushi|ramen|pão|moqueca|culin/.test(text)) {
    return { label: "Recipes", accent: "yellow" }
  }
  if (/filme|cinema|matrix|série|serie|oppenheimer|chefão|interestelar/.test(text)) {
    return { label: "Culture", accent: "blue" }
  }

  const fallback = ["Ideas", "Reading", "Projects", "Learning"][index % 4]
  return { label: fallback, accent: ["sage", "blue", "yellow", "terracotta"][index % 4] }
}

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [totalNotes, setTotalNotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Note[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ title: "", content: "" })
  const [saving, setSaving] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [activePage, setActivePage] = useState<"home" | "all" | "chat">("home")

  const fetchNotes = async () => {
    try {
      const data = await API_CONFIG.getNotes()
      const notesArray = Array.isArray(data) ? data : []
      setNotes(notesArray)
      setTotalNotes(notesArray.length)
    } catch (error) {
      console.error("Erro ao buscar notas:", error)
      setNotes([])
      setTotalNotes(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const results = await API_CONFIG.searchNotes({ query })
      setSearchResults(Array.isArray(results) ? results : [])
    } catch (error) {
      console.error("Erro na busca:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const handleCreateNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return

    setSaving(true)
    try {
      const result = await API_CONFIG.createNote({
        title: formData.title,
        content: formData.content,
      })

      if (!result.error) {
        setFormData({ title: "", content: "" })
        setIsDialogOpen(false)
        fetchNotes()
      } else {
        console.error("Erro ao criar nota:", result.error)
      }
    } catch (error) {
      console.error("Erro ao criar nota:", error)
    } finally {
      setSaving(false)
    }
  }

  const openCreateDialog = () => {
    setFormData({ title: "", content: "" })
    setIsDialogOpen(true)
  }

  const isSearchActive = Boolean(searchQuery.trim())
  const displayedNotes = activePage !== "chat" ? (isSearchActive ? searchResults : notes) : []

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  const truncateContent = (content: string, maxLength = 112) =>
    content.length <= maxLength ? content : `${content.slice(0, maxLength)}...`

  return (
    <div className="notes-shell">
      <aside className="notes-sidebar">
        <div className="notes-brand">
          <span className="notes-brand-mark"><StickyNote className="h-4 w-4" /></span>
          <span>Notes</span>
        </div>

        <p className="notes-nav-label">Workspace</p>
        <nav className="notes-nav" aria-label="Workspace">
          <button
            type="button"
            onClick={() => setActivePage("all")}
            aria-label="All Notes"
            title="All Notes"
            className={`notes-nav-item ${activePage !== "chat" ? "notes-nav-item--active" : ""}`}
          >
            <BookOpen className="h-[18px] w-[18px]" />
            <span>All Notes</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage("chat")}
            aria-label="Chat AI"
            title="Chat AI"
            className={`notes-nav-item ${activePage === "chat" ? "notes-nav-item--active" : ""}`}
          >
            <MessageSquare className="h-[18px] w-[18px]" />
            <span>Chat AI</span>
          </button>
        </nav>

        <div className="notes-sidebar-bottom">
          <div className="notes-workspace-card">
            <p className="notes-eyebrow">Workspace</p>
            <p className="notes-workspace-name">Personal knowledge</p>
            <div className="notes-workspace-status"><span /> Local and synced</div>
            <p className="notes-workspace-count">{totalNotes} {totalNotes === 1 ? "Note" : "Notes"}</p>
          </div>
        </div>
      </aside>

      <main className="notes-main">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <header className="notes-topbar">
            <div className="notes-search-wrap">
              {isSearching ? (
                <Loader2 className="notes-search-icon notes-search-icon--spin" />
              ) : (
                <Search className="notes-search-icon" />
              )}
              <Input
                aria-label="Search your notes"
                placeholder="Search your notes..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="notes-search-input"
              />
            </div>

            <div className="notes-top-actions">
              <span className="notes-shortcut">Press ⌘ K to create</span>
              <DialogTrigger asChild>
                <button type="button" className="notes-new-button" aria-label="New Note" title="New Note">
                  <Plus className="h-4 w-4" />
                  <span>New Note</span>
                </button>
              </DialogTrigger>
              <div className="notes-avatar" aria-label="Hállan Costa">HC</div>
            </div>
          </header>

          <DialogContent className="notes-dialog">
            <DialogDescription className="sr-only">Create a new note with title and content</DialogDescription>
            <div className="notes-dialog-header">
              <div>
                <p className="notes-eyebrow">Quick capture</p>
                <DialogTitle>Create New Note</DialogTitle>
              </div>
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="notes-dialog-fields">
              <div>
                <label className="notes-field-label">Title</label>
                <Input
                  placeholder="Give your note a title"
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  className="notes-dialog-input"
                />
              </div>
              <div>
                <label className="notes-field-label">Content</label>
                <Textarea
                  placeholder="Write down what you learned..."
                  value={formData.content}
                  onChange={(event) => setFormData({ ...formData, content: event.target.value })}
                  className="notes-dialog-input notes-dialog-textarea"
                />
              </div>
            </div>
            <DialogFooter className="notes-dialog-footer">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="notes-outline-button">
                Cancel
              </Button>
              <Button onClick={handleCreateNote} disabled={saving || !formData.title.trim() || !formData.content.trim()} className="notes-save-button">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {activePage === "chat" ? (
          <div className="notes-chat-content">
            <header className="notes-chat-intro">
              <p className="notes-eyebrow">A thoughtful copilot for your notes</p>
              <h1>Ask better questions.<br />Find useful connections.</h1>
              <p>Chat with your knowledge base and turn scattered notes into clear next steps.</p>
            </header>
            <div className="notes-chat-layout">
              <div className="notes-chat-panel">
                <ChatAI noteCount={totalNotes} />
              </div>
              <aside className="notes-chat-context" aria-label="Chat context">
                <p className="notes-eyebrow">Context at a glance</p>
                <h2>Connected notes</h2>
                <p>Relevant notes stay visible while you explore an idea.</p>

                <div className="notes-chat-context-section">
                  <p className="notes-chat-context-label">Available in this workspace</p>
                  {notes.slice(0, 3).map((note, index) => (
                    <div className="notes-chat-note-link" key={note.id}>
                      <span className={`notes-chat-note-dot notes-chat-note-dot--${index % 3}`} />
                      <div>
                        <strong>{note.title}</strong>
                        <small>{formatDate(note.created_at)}</small>
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="notes-chat-context-empty">Your relevant notes will appear here.</p>
                  )}
                </div>

                <div className="notes-chat-context-section">
                  <p className="notes-chat-context-label">Try asking</p>
                  <div className="notes-chat-suggestion-list">
                    <div className="notes-chat-suggestion"><strong>Summarize</strong>What did I learn this week?</div>
                    <div className="notes-chat-suggestion"><strong>Connect</strong>Which notes relate to embeddings?</div>
                    <div className="notes-chat-suggestion"><strong>Plan</strong>Turn this into three next steps.</div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <div className="notes-content">
            {!isSearchActive && (
              <section className="notes-hero">
                <div className="notes-hero-copy">
                  <p className="notes-eyebrow">Your knowledge garden</p>
                  <h1>Keep the good ideas close.</h1>
                  <p>
                    Capture thoughts, references and small discoveries. Your notes stay calm,
                    searchable and ready when you need them.
                  </p>
                </div>
                <div className="notes-quick-card">
                  <div>
                    <p className="notes-eyebrow">Quick capture</p>
                    <h2>What is on your mind?</h2>
                    <p>Start with a thought, a link or something you learned today.</p>
                  </div>
                  <button type="button" onClick={openCreateDialog} className="notes-capture-button">
                    <span>Start writing</span>
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </section>
            )}

            <div className="notes-section-heading">
              <div>
                <p className="notes-eyebrow">{isSearchActive ? "Search your knowledge base" : "Fresh from your workspace"}</p>
                <h2>{isSearchActive ? "Search results" : "Recent notes"}</h2>
              </div>
              {isSearchActive && displayedNotes.length > 0 && (
                <button type="button" onClick={() => setSearchQuery("")} className="notes-clear-search">
                  Clear search <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="notes-layout">
              <div className="notes-primary">
                {loading || isSearching ? (
                  <div className="notes-loading"><Loader2 className="h-8 w-8 animate-spin" /><span>Searching...</span></div>
                ) : displayedNotes.length === 0 ? (
                  isSearchActive ? (
                    <SearchEmptyState query={searchQuery} onClear={() => setSearchQuery("")} onCreate={openCreateDialog} />
                  ) : (
                    <NotesEmptyState onCreate={openCreateDialog} />
                  )
                ) : (
                  <div className="notes-grid">
                    {displayedNotes.map((note, index) => {
                      const presentation = getNotePresentation(note, index)
                      return (
                        <article key={note.id} className={`notes-card notes-card--${presentation.accent}`}>
                          <div className="notes-card-meta">
                            <span className="notes-card-tag">{presentation.label}</span>
                            <span>{formatDate(note.created_at)}</span>
                          </div>
                          <h3>{note.title}</h3>
                          <p>{truncateContent(note.content)}</p>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>

              {!isSearchActive && displayedNotes.length > 0 && (
                <aside className="notes-insights">
                  <p className="notes-eyebrow">Semantic highlights</p>
                  <h3>What you explored lately</h3>
                  <div className="notes-insight-list">
                    <div><span className="notes-insight-icon">↗</span><span>Local AI workflows</span></div>
                    <div><span className="notes-insight-icon notes-insight-icon--terracotta">✦</span><span>Product design notes</span></div>
                    <div><span className="notes-insight-icon notes-insight-icon--blue">◌</span><span>Brazilian payments</span></div>
                  </div>
                  <div className="notes-insights-divider" />
                  <p className="notes-eyebrow">Recent searches</p>
                  <div className="notes-query-row"><span>semantic search</span><span>{Math.max(1, Math.ceil(totalNotes * 0.33))} notes</span></div>
                  <div className="notes-query-row"><span>payment infrastructure</span><span>{Math.max(1, Math.ceil(totalNotes * 0.22))} notes</span></div>
                  <div className="notes-query-row"><span>recipes without cream</span><span>{Math.max(1, Math.ceil(totalNotes * 0.14))} notes</span></div>
                </aside>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
