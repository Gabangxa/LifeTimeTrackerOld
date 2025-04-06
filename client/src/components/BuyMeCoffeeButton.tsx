import React from 'react';
import { cn } from '@/lib/utils';

interface BuyMeCoffeeButtonProps {
  username: string;
  className?: string;
  variant?: 'default' | 'small';
  text?: string;
}

export function BuyMeCoffeeButton({
  username,
  className,
  variant = 'default',
  text = 'Buy me a coffee',
}: BuyMeCoffeeButtonProps) {
  const isSmall = variant === 'small';
  
  return (
    <a 
      href={`https://www.buymeacoffee.com/${username}`}
      target="_blank" 
      rel="noopener noreferrer" 
      className={cn(
        "flex items-center bg-[#FFDD00] text-[#000000] rounded-md font-bold transition-colors hover:bg-[#FFDD00]/90",
        isSmall ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm",
        className
      )}
    >
      <img 
        src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" 
        alt="Buy me a coffee" 
        className={cn("mr-1.5", isSmall ? "h-3 w-3" : "h-4 w-4")}
      />
      {text}
    </a>
  );
}