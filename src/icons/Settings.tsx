import React from 'react';
import { IconProps } from './types';

export const Settings = React.memo<IconProps>(({ size = 16, className, ...props }) => {
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
      <circle 
        cx="8" 
        cy="8" 
        r="2" 
        stroke="currentColor" 
        strokeWidth="1.5" 
      />
      <path
        d="M13.3 9.8C13.4 9.2 13.4 8.8 13.4 8C13.4 7.2 13.4 6.8 13.3 6.2L11.8 5.6C11.6 5.1 11.3 4.7 11 4.3L11.3 2.7C10.8 2.3 10.2 2 9.5 1.8L8.5 3.1C8.2 3 7.8 3 7.5 3.1L6.5 1.8C5.8 2 5.2 2.3 4.7 2.7L5 4.3C4.7 4.7 4.4 5.1 4.2 5.6L2.7 6.2C2.6 6.8 2.6 7.2 2.6 8C2.6 8.8 2.6 9.2 2.7 9.8L4.2 10.4C4.4 10.9 4.7 11.3 5 11.7L4.7 13.3C5.2 13.7 5.8 14 6.5 14.2L7.5 12.9C7.8 13 8.2 13 8.5 12.9L9.5 14.2C10.2 14 10.8 13.7 11.3 13.3L11 11.7C11.3 11.3 11.6 10.9 11.8 10.4L13.3 9.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

Settings.displayName = 'Settings';

export default Settings;