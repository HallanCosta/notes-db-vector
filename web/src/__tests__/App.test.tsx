import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

const mockNotes = [
  { id: '1', title: 'Test Note 1', content: 'Content 1', created_at: '2024-01-01' },
  { id: '2', title: 'Test Note 2', content: 'Content 2', created_at: '2024-01-02' },
]

const mockGetNotes = vi.fn()
const mockCreateNote = vi.fn()
const mockSearchNotes = vi.fn()
const mockGetChatMessages = vi.fn()
const mockSendChatMessage = vi.fn()
const mockClearChat = vi.fn()

vi.mock('../lib/api', () => ({
  API_CONFIG: {
    getNotes: (...args: unknown[]) => mockGetNotes(...args),
    createNote: (...args: unknown[]) => mockCreateNote(...args),
    searchNotes: (...args: unknown[]) => mockSearchNotes(...args),
    getChatMessages: (...args: unknown[]) => mockGetChatMessages(...args),
    sendChatMessage: (...args: unknown[]) => mockSendChatMessage(...args),
    clearChat: (...args: unknown[]) => mockClearChat(...args),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

it('should render loading state initially', async () => {
  mockGetNotes.mockImplementation(
    () => new Promise(() => {})
  )

  render(<App />)

  expect(screen.getByRole('button', { name: /new note/i })).toBeInTheDocument()
})

it('should render notes after loading', async () => {
  mockGetNotes.mockResolvedValue(mockNotes)

  render(<App />)

  await waitFor(() => {
    expect(screen.getByText('Test Note 1')).toBeInTheDocument()
    expect(screen.getByText('Test Note 2')).toBeInTheDocument()
  })
})

it('should render empty state when no notes', async () => {
  mockGetNotes.mockResolvedValue([])

  render(<App />)

  await waitFor(() => {
    expect(screen.getByText(/your knowledge base starts here/i)).toBeInTheDocument()
  })
})

it('should render a useful empty state for searches without results', async () => {
  mockGetNotes.mockResolvedValue(mockNotes)
  mockSearchNotes.mockResolvedValue([])

  render(<App />)

  const searchInput = screen.getByPlaceholderText(/search your notes/i)
  await userEvent.type(searchInput, 'quantum computing')

  await waitFor(() => {
    expect(screen.getByText(/no notes found for/i)).toBeInTheDocument()
  })

  await userEvent.click(screen.getByRole('button', { name: /clear search/i }))
  expect(searchInput).toHaveValue('')
})

it('should show Chat AI prompt suggestions', async () => {
  mockGetNotes.mockResolvedValue([])
  mockGetChatMessages.mockResolvedValue([])

  render(<App />)

  await userEvent.click(screen.getByRole('button', { name: /chat ai/i }))

  expect(screen.getByText(/ask anything about your notes/i)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /summarize my latest notes/i }))
  expect(screen.getByPlaceholderText(/ask about your notes/i)).toHaveValue('Summarize my latest notes')
})

it('should open create note dialog', async () => {
  mockGetNotes.mockResolvedValue([])

  render(<App />)

  const newNoteButton = screen.getByRole('button', { name: /new note/i })
  await userEvent.click(newNoteButton)

  expect(screen.getByText('Create New Note')).toBeInTheDocument()
})

it('should search notes', async () => {
  mockGetNotes.mockResolvedValue(mockNotes)
  mockSearchNotes.mockResolvedValue([mockNotes[0]])

  render(<App />)

  await waitFor(() => {
    expect(screen.getByText('Test Note 1')).toBeInTheDocument()
  })

  const searchInput = screen.getByPlaceholderText(/search your notes/i)
  await userEvent.type(searchInput, 'test')

  await waitFor(() => {
    expect(mockSearchNotes).toHaveBeenCalledWith({ query: 'test' })
  })
})

it('should display note count', async () => {
  mockGetNotes.mockResolvedValue(mockNotes)

  render(<App />)

  await waitFor(() => {
    expect(screen.getByText('2 Notes')).toBeInTheDocument()
  })
})

it('should display singular note count', async () => {
  mockGetNotes.mockResolvedValue([mockNotes[0]])

  render(<App />)

  await waitFor(() => {
    expect(screen.getByText('1 Note')).toBeInTheDocument()
  })
})
