import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-card shadow-card transition-shadow',
          'p-10 md:p-8',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardIconContainerProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: string;
}

export const CardIconContainer = forwardRef<HTMLDivElement, CardIconContainerProps>(
  ({ className, gradient = 'linear-gradient(#00c853, #00a63e)', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('w-24 h-24 rounded-card p-6 flex items-center justify-center', className)}
        style={{ background: gradient }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardIconContainer.displayName = 'CardIconContainer';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-card-title text-text-primary mb-4', className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = 'CardTitle';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('text-base text-text-secondary', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';
