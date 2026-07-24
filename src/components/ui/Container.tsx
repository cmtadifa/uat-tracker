import { HTMLAttributes } from 'react'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  size?: keyof typeof sizes
}

export default function Container({ size = 'md', className = '', ...props }: ContainerProps) {
  return <main className={`mx-auto w-full ${sizes[size]} px-6 py-10 sm:px-8 ${className}`} {...props} />
}
