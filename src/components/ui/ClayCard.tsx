import React from 'react';

interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
 variant?: 'normal' | 'thick' | 'elevated';
 children: React.ReactNode;
 className?: string;
}

export function ClayCard({ variant = 'thick', children, className = '', ...props }: ClayCardProps) {
 let baseClass = 'clay-card';
 if (variant === 'thick') baseClass = 'clay-card-thick';
 if (variant === 'elevated') baseClass = 'clay-card-elevated';

 return (
 <div className={`${baseClass} rounded-2xl ${className}`} {...props}>
 {children}
 </div>
 );
}
