import React from 'react';
import { IconProps } from './types';

export const Columns = React.memo<IconProps>(({ size = 16, className, ...props }) => {
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
        d="M5.33334 2H2.66667C2.29848 2 2 2.29848 2 2.66667V13.3333C2 13.7015 2.29848 14 2.66667 14H5.33334C5.70153 14 6.00001 13.7015 6.00001 13.3333V2.66667C6.00001 2.29848 5.70153 2 5.33334 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.3333 2H10.6667C10.2985 2 10 2.29848 10 2.66667V13.3333C10 13.7015 10.2985 14 10.6667 14H13.3333C13.7015 14 14 13.7015 14 13.3333V2.66667C14 2.29848 13.7015 2 13.3333 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

Columns.displayName = 'Columns';

export default Columns;