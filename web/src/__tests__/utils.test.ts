import { it, expect } from 'vitest'
import { cn } from '../lib/utils'

it('should merge class names', () => {
  const result = cn('foo', 'bar')
  expect(result).toBe('foo bar')
})

it('should handle conditional classes', () => {
  const result = cn('foo', false && 'bar', 'baz')
  expect(result).toBe('foo baz')
})

it('should handle arrays', () => {
  const result = cn(['foo', 'bar'])
  expect(result).toBe('foo bar')
})

it('should handle objects', () => {
  const result = cn({ foo: true, bar: false })
  expect(result).toBe('foo')
})

it('should merge tailwind classes with conflicts', () => {
  const result = cn('px-2 px-4')
  expect(result).toBe('px-4')
})
