import React from 'react';
import { IconProps } from './types';

export const EyeOff = React.memo<IconProps>(({ size = 16, className, ...props }) => {
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
        d="M9.5 6.5C9.5 5.67157 8.82843 5 8 5C7.17157 5 6.5 5.67157 6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3L13 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 10.5C7.1 11.1 7.9 11.5 8 11.5C13 11.5 15 6.5 15 6.5C14.4 5.4 13.3 4.2 12 3.5M3.5 8.5C2.5 7.5 1 6.5 1 6.5C1 6.5 3 1.5 8 1.5C9.5 1.5 10.8 2.1 11.8 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

EyeOff.displayName = 'EyeOff';

export default EyeOff;