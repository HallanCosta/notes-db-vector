// Mock data for tests

export const mockEmbedding = [
  0.0123, -0.0234, 0.0345, -0.0456, 0.0567, -0.0678, 0.0789, -0.0890,
  0.0901, -0.1012, 0.1123, -0.1234, 0.1345, -0.1456, 0.1567, -0.1678
];

export const mockNote = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Note',
  content: 'This is a test note content',
  created_at: '2024-01-01T00:00:00.000Z'
};

export const mockNotes = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Note 1',
    content: 'Content 1',
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    title: 'Test Note 2',
    content: 'Content 2',
    created_at: '2024-01-02T00:00:00.000Z'
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    title: 'Test Note 3',
    content: 'Content 3',
    created_at: '2024-01-03T00:00:00.000Z'
  }
];

export const mockSearchResults = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Note 1',
    content: 'Content 1',
    created_at: '2024-01-01T00:00:00.000Z',
    similarity: 0.95
  }
];

export const createMockNoteInput = {
  title: 'New Note',
  content: 'New note content for testing'
};

export const invalidNoteInput = {
  title: '',
  content: ''
};
