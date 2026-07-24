import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary: 'border border-border bg-card text-card-foreground hover:bg-muted',
  success: 'bg-success text-success-foreground hover:opacity-90',
  danger: 'bg-danger text-danger-foreground hover:opacity-90',
  ghost: 'border border-border bg-transparent text-foreground hover:bg-muted',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
