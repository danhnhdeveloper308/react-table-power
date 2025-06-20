import React from 'react';
import { IconProps } from './types';

export const MoreHorizontal = React.memo<IconProps>(({ size = 16, className, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M8.66667 8C8.66667 7.63181 8.36819 7.33334 8 7.33334C7.63181 7.33334 7.33333 7.63181 7.33333 8C7.33333 8.36819 7.63181 8.66667 8 8.66667C8.36819 8.66667 8.66667 8.36819 8.66667 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.3333 8C13.3333 7.63181 13.0349 7.33334 12.6667 7.33334C12.2985 7.33334 12 7.63181 12 8C12 8.36819 12.2985 8.66667 12.6667 8.66667C13.0349 8.66667 13.3333 8.36819 13.3333 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.99999 8C3.99999 7.63181 3.70152 7.33334 3.33333 7.33334C2.96514 7.33334 2.66666 7.63181 2.66666 8C2.66666 8.36819 2.96514 8.66667 3.33333 8.66667C3.70152 8.66667 3.99999 8.36819 3.99999 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

MoreHorizontal.displayName = 'MoreHorizontal';

export default MoreHorizontal;