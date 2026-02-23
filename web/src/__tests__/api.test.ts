import { it, expect, vi, beforeEach } from 'vitest'
import { API_CONFIG } from '../lib/api'

const mockNotes = [
  { id: '1', title: 'Note 1', content: 'Content 1', created_at: '2024-01-01' },
  { id: '2', title: 'Note 2', content: 'Content 2', created_at: '2024-01-02' },
]

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn()
  global.fetch = mockFetch
})

it('should fetch all notes', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockNotes
  })

  const result = await API_CONFIG.getNotes()

  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining('/functions/v1/get-notes'),
    expect.objectContaining({ headers: expect.any(Object) })
  )
  expect(result).toEqual(mockNotes)
})

it('should throw error on network failure', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'))

  await expect(API_CONFIG.getNotes()).rejects.toThrow('Network error')
})

it('should create a note', async () => {
  const newNote = { title: 'New Note', content: 'New Content' }
  const createdNote = { ...newNote, id: '3', created_at: '2024-01-03' }

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [createdNote]
  })

  const result = await API_CONFIG.createNote(newNote)

  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining('/functions/v1/create-note'),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(newNote)
    })
  )
  expect(result).toEqual([createdNote])
})

it('should search notes by query', async () => {
  const query = 'test search'
  const searchResults = [{ id: '1', title: 'Note 1', content: 'Content 1', similarity: 0.95 }]

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => searchResults
  })

  const result = await API_CONFIG.searchNotes({ query })

  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining(`/functions/v1/search-notes?q=${encodeURIComponent(query)}`),
    expect.any(Object)
  )
  expect(result).toEqual(searchResults)
})

it('should return headers with authorization', () => {
  const headers = API_CONFIG.getHeaders()

  expect(headers).toHaveProperty('Content-Type', 'application/json')
  expect(headers).toHaveProperty('Authorization')
})
