import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  FileText,
  FilePlus2,
  Loader2,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  SearchX,
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
    <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-[#fcfbff] to-[#f5f3ff] px-6 py-14 text-center shadow-sm sm:px-10">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-100/70 blur-[1px]" />
      <div className="pointer-events-none absolute -bottom-32 left-16 h-56 w-56 rounded-full bg-blue-100/60 blur-[1px]" />

      <div className="relative mx-auto max-w-xl">
        <div className="relative mx-auto mb-7 h-32 w-40">
          <div className="absolute left-8 top-2 h-24 w-20 rotate-[-10deg] rounded-2xl border border-violet-200 bg-violet-100 shadow-sm" />
          <div className="absolute left-12 top-1 h-24 w-20 rotate-[8deg] rounded-2xl border border-violet-200 bg-violet-50 shadow-sm" />
          <div className="absolute left-11 top-5 h-24 w-20 rounded-2xl border border-violet-100 bg-white shadow-lg shadow-violet-900/10">
            <div className="absolute left-4 top-7 h-1.5 w-11 rounded-full bg-violet-200" />
            <div className="absolute left-4 top-12 h-1.5 w-8 rounded-full bg-slate-100" />
          </div>
          <span className="absolute left-0 top-8 text-2xl text-violet-500">✦</span>
          <span className="absolute right-1 top-14 text-lg text-blue-400">✧</span>
        </div>

        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
          Your knowledge base starts here
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Capture an idea, save a reference, or write down what you learned. Your notes will become searchable and ready for AI.
        </p>
        <Button
          onClick={onCreate}
          className="mt-6 h-11 rounded-xl bg-white px-4 text-sm font-semibold text-violet-700 shadow-sm ring-1 ring-violet-200 hover:bg-violet-50"
        >
          <FilePlus2 className="h-4 w-4" />
          Create your first note
        </Button>
      </div>
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
    <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-[#fcfbff] to-[#f5f3ff] px-6 py-16 text-center shadow-sm sm:px-10">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-100/70" />
      <div className="pointer-events-none absolute -bottom-32 left-16 h-56 w-56 rounded-full bg-blue-100/60" />

      <div className="relative mx-auto max-w-xl">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-[24px] bg-gradient-to-br from-violet-100 to-blue-50 text-violet-600 shadow-inner">
          <SearchX className="h-10 w-10 stroke-[1.5]" />
        </div>
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
          Nothing matched this search
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          No notes found for <span className="font-medium text-foreground">“{query}”</span>. Try a broader phrase, clear the search, or create a new note.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={onClear}
            className="h-10 rounded-xl border-violet-200 bg-white px-3 text-xs font-semibold text-violet-700 hover:bg-violet-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear search
          </Button>
          <Button
            variant="outline"
            onClick={onCreate}
            className="h-10 rounded-xl border-violet-200 bg-white px-3 text-xs font-semibold text-violet-700 hover:bg-violet-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Create a note
          </Button>
        </div>
      </div>
    </div>
  )
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

  // Carregar notas
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

  // Buscar notas por similaridade vetorial
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const results = await API_CONFIG.searchNotes({ query })
      const resultsArray = Array.isArray(results) ? results : []
      setSearchResults(resultsArray)
    } catch (error) {
      console.error("Erro na busca:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce para busca automática
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

  // Criar nota com embedding
  const handleCreateNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return

    setSaving(true)
    try {
      const result = await API_CONFIG.createNote({ title: formData.title, content: formData.content })

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

  // Abrir diálogo para criar
  const openCreateDialog = () => {
    setFormData({ title: "", content: "" })
    setIsDialogOpen(true)
  }

  // Mostrar todas as notas ou resultado de busca
  const displayedNotes = activePage !== "chat" ? (searchQuery.trim() ? searchResults : notes) : []

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Limitar conteúdo para preview
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + "..."
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Sidebar */}
      <aside className="fixed flex h-screen w-20 flex-col border-r border-gray-200 bg-white sm:w-60">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 p-4 sm:justify-start sm:p-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <StickyNote className="w-5 h-5 text-white" />
          </div>
          <span className="hidden text-lg font-semibold text-foreground sm:inline">Notes</span>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-2 sm:px-3">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActivePage("all")}
                aria-label="All Notes"
                title="All Notes"
                className={`flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all sm:justify-start ${
                  activePage !== "chat"
                    ? "bg-gray-100 text-foreground"
                    : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">All Notes</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActivePage("chat")}
                aria-label="Chat AI"
                title="Chat AI"
                className={`flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all sm:justify-start ${
                  activePage === "chat"
                    ? "bg-gray-100 text-foreground"
                    : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat AI</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer - Contador */}
        <div className="hidden p-6 pt-0 sm:block">
          <Badge variant="secondary" className="w-full justify-center py-1.5">
            {totalNotes} {totalNotes === 1 ? "Note" : "Notes"}
          </Badge>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 min-w-0 flex-1 sm:ml-60">
        {/* Header */}
        <header className="bg-[#F8F9FB] px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                {isSearching ? (
                  <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
                ) : (
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                )}
                <Input
                  aria-label="Search your notes"
                  placeholder="Search your notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-2xl bg-white border-gray-200 shadow-sm focus:shadow-md transition-shadow"
                />
              </div>
            </div>

            {/* New Note Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button
                  onClick={openCreateDialog}
                  aria-label="New Note"
                  title="New Note"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-0 font-semibold text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-xl sm:h-12 sm:w-auto sm:px-6"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">New Note</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden bg-white border-0 shadow-2xl">
                <DialogDescription className="sr-only">
                  Create a new note with title and content
                </DialogDescription>
                {/* Header com gradiente */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                  <DialogTitle className="text-xl font-semibold text-white">Create New Note</DialogTitle>
                </div>

                <div className="grid gap-5 py-6 px-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
                    <Input
                      placeholder="Enter note title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="h-12 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-200 text-base bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Content</label>
                    <Textarea
                      placeholder="Write your note here..."
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      className="min-h-[180px] rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-200 resize-none text-base bg-white"
                    />
                  </div>
                </div>
                <DialogFooter className="sm:justify-end gap-3 px-6 pb-6 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-xl h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateNote}
                    disabled={saving || !formData.title.trim() || !formData.content.trim()}
                    className="rounded-xl h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save Note
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Chat AI */}
        {activePage === "chat" && (
          <div className="h-[calc(100vh-120px)] px-4 pb-4 sm:px-8 sm:pb-8">
            <div className="h-full rounded-2xl border bg-white overflow-hidden">
              <ChatAI />
            </div>
          </div>
        )}

        {/* Notes List */}
        {activePage !== "chat" && (
        <div className="px-4 pb-8 sm:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-violet-400">
                {searchQuery.trim() ? "Search your knowledge base" : "Your workspace"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {searchQuery.trim() ? "Nothing matched this search" : "Your Notes"}
              </h2>
            </div>
            {searchQuery.trim() && displayedNotes.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900"
              >
                Clear search
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {loading || isSearching ? (
            <div className="flex justify-center py-16 items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" /> <span>Searching...</span>
            </div>
          ) : displayedNotes.length === 0 ? (
            searchQuery.trim() ? (
              <SearchEmptyState
                query={searchQuery}
                onClear={() => setSearchQuery("")}
                onCreate={openCreateDialog}
              />
            ) : (
              <NotesEmptyState onCreate={openCreateDialog} />
            )
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedNotes.map((note) => (
                <Card
                  key={note.id}
                  className="p-5 rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer bg-white"
                >
                  <CardContent className="p-0">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                      {note.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {truncateContent(note.content)}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {formatDate(note.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        )}
      </main>
    </div>
  )
}

export default App
