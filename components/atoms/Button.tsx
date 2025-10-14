import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-button font-bold transition-all',
          'text-sm md:text-base px-4 py-3 md:px-6 md:py-4',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-brand text-white border border-brand shadow-[0_4px_8px_rgba(0,0,0,0.14)] hover:bg-white hover:text-brand':
              variant === 'primary',
            'bg-white text-text-secondary border border-brand shadow-[0_4px_8px_rgba(0,0,0,0.14)] hover:bg-brand hover:text-white':
              variant === 'secondary',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
