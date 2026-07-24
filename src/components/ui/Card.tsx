import { HTMLAttributes } from 'react'

export default function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm ${className}`}
      {...props}
    />
  )
}
