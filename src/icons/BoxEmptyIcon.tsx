// Create a simple empty box icon component

import React from 'react';
import { IconProps } from './types';

export const BoxEmptyIcon = React.memo<IconProps>(({ size = 16, className, ...props }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 3v18h18V3H3zm15 15H6V6h12v12z" />
            <path d="M10 10h4v4h-4z" />
        </svg>
    )
});

BoxEmptyIcon.displayName = 'BoxEmptyIcon';
export default BoxEmptyIcon;