import React from 'react';
import { IconProps } from './types';

export const Filter = React.memo<IconProps>(({ size = 16, className, ...props }) => {
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
        d="M14.5 2H1.5L6.5 7.87V12.5L9.5 14V7.87L14.5 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

Filter.displayName = 'Filter';

export default Filter;