import type { ReactNode } from 'react'

export function PageHeader({ titolo, sotto }: { titolo: string; sotto?: ReactNode }) {
  return (
    <div className="section-header page-header">
      <h1>{titolo}</h1>
      {sotto && <p>{sotto}</p>}
    </div>
  )
}
