import type { ReactNode } from 'react'

interface Props<T> {
  items: readonly T[]
  /** Etichetta accessibile della lista. */
  label: string
  keyOf: (item: T) => string
  renderItem: (item: T, i: number) => ReactNode
  className?: string
}

/** Lista semantica (ul/li) condivisa da tutte le route: è l'equivalente DOM di ogni collezione, anche in vista 3D. */
export function ListView<T>({ items, label, keyOf, renderItem, className }: Props<T>) {
  return (
    <ul className={className ? `lista ${className}` : 'lista'} aria-label={label}>
      {items.map((item, i) => (
        <li key={keyOf(item)}>{renderItem(item, i)}</li>
      ))}
    </ul>
  )
}
