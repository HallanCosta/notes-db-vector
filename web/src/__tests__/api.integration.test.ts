import { it, expect, beforeEach } from 'vitest'
import { API_CONFIG } from '../lib/api'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const skipIfNoEnv = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return true
  }
  return false
}

let createdNoteId: string | null = null

beforeEach(async () => {
  if (skipIfNoEnv()) {
    return
  }
  // Cleanup: delete created notes after each test
  if (createdNoteId) {
    try {
      await fetch(`${API_CONFIG.functionsUrl}/delete-notes`, {
        method: 'DELETE',
        headers: API_CONFIG.getHeaders(),
      })
    } catch {
      // Ignore cleanup errors
    }
    createdNoteId = null
  }
})

it('should fetch all notes from real API', async () => {
  if (skipIfNoEnv()) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  }

  const result = await API_CONFIG.getNotes()

  expect(result).toBeInstanceOf(Array)
}, 30000)

it('should create note via real API', async () => {
  if (skipIfNoEnv()) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  }

  const newNote = { title: 'Integration Test Note', content: 'Test content' }
  const result = await API_CONFIG.createNote(newNote)

  expect(result).toBeInstanceOf(Array)
  expect(result[0]).toHaveProperty('id')
  expect(result[0].title).toBe(newNote.title)

  createdNoteId = result[0]?.id
}, 30000)

it('should search notes via real API', async () => {
  if (skipIfNoEnv()) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  }

  // First create a note to search for
  const newNote = { title: 'Searchable Note', content: 'Find me' }
  const createResult = await API_CONFIG.createNote(newNote)
  createdNoteId = createResult[0]?.id

  // Then search for it
  const result = await API_CONFIG.searchNotes({ query: 'Searchable' })

  expect(result).toBeInstanceOf(Array)
}, 30000)
