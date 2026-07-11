import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20',
        secondary: 'bg-white/5 text-text-secondary border border-border',
        success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
        destructive: 'bg-red-500/15 text-red-400 border border-red-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
