import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full h-[54px] px-4 py-6 rounded-[14px] border border-[#e5e7eb]',
          'bg-[#f3f3f5] text-text-secondary placeholder:text-[#717182]',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
          'transition-all',
          'disabled:cursor-not-allowed disabled:opacity-50',
          {
            'border-red-500 focus:ring-red-500': error,
          },
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
