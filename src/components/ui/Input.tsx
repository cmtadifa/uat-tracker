import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

const fieldStyles =
  'w-full rounded-lg border border-border bg-card text-card-foreground placeholder:text-muted-foreground px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-ring/30'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldStyles} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldStyles} ${className}`} {...props} />
}
