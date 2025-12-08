'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    children?: React.ReactNode;
    icon?: React.ReactNode;
}

/**
 * A reusable button component with different variants
 */
export default function Button({
    variant = 'primary',
    children,
    icon,
    className = '',
    ...props
}: ButtonProps) {

    const baseClasses = 'rounded-full transition-colors flex items-center justify-center gap-2 font-medium text-sm leading-none';

    const variantClasses = {
        primary: 'px-4 py-2 bg-[#1e3a5f] text-white hover:bg-[#2a4f7f] shadow-sm',
        secondary: 'px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 shadow-sm',
        ghost: 'p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    };

    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props} >
            {icon}
            {children}
        </button>
    );
}
