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
import { Plus, Search, FileText, Home, Loader2, StickyNote } from "lucide-react"
import { API_CONFIG } from "./lib/api"

interface Note {
  id: string
  title: string
  content: string
  created_at: string
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
  const [activePage, setActivePage] = useState<"home" | "all">("home")

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
      return
    }

    try {
      const results = await API_CONFIG.searchNotes({ query })
      const resultsArray = Array.isArray(results) ? results : []
      setSearchResults(resultsArray)
    } catch (error) {
      console.error("Erro na busca:", error)
      setSearchResults([])
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

  const displayedNotes = searchQuery.trim() ? searchResults : notes

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
      <aside className="w-60 bg-white border-r border-gray-200 fixed h-screen flex flex-col">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <StickyNote className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-foreground">Notes</span>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActivePage("all")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activePage === "all"
                    ? "bg-gray-100 text-foreground"
                    : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                }`}
              >
                <FileText className="w-4 h-4" />
                All Notes
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer - Contador */}
        <div className="p-6 pt-0">
          <Badge variant="secondary" className="w-full justify-center py-1.5">
            {totalNotes} {totalNotes === 1 ? "Note" : "Notes"}
          </Badge>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60">
        {/* Header */}
        <header className="bg-[#F8F9FB] px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
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
                  className="h-12 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Note
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

        {/* Notes List */}
        <div className="px-8 pb-8">
          <h2 className="text-xl font-semibold mb-6 text-foreground">Your Notes</h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : displayedNotes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <StickyNote className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-2">
                {searchQuery.trim()
                  ? "No notes found for your search."
                  : "No notes yet."}
              </p>
              <p className="text-muted-foreground text-sm">
                {searchQuery.trim()
                  ? "Try searching with different terms."
                  : "Click 'New Note' to create your first note."}
              </p>
            </div>
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
      </main>
    </div>
  )
}

export default App
