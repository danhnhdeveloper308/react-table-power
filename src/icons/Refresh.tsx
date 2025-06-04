import React from 'react';
import { IconProps } from './types';

export const Refresh = React.memo<IconProps>(({ size = 16, className, ...props }) => {
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
        d="M14.6666 3.33334V7.33334H10.6666"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.33337 12.6667V8.66666H5.33337"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.82671 6C3.1695 4.9935 3.80171 4.1181 4.64216 3.50094C5.4826 2.88377 6.48548 2.55577 7.51278 2.56079C8.54009 2.56581 9.53898 2.90359 10.3729 3.52897C11.2068 4.15436 11.8297 5.03566 12.1617 6.00001M3.84004 10C4.17204 11.0065 4.80425 11.8819 5.6447 12.4991C6.48514 13.1163 7.48802 13.4443 8.51532 13.4392C9.54263 13.4342 10.5415 13.0964 11.3754 12.471C12.2093 11.8456 12.8322 10.9643 13.1642 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

Refresh.displayName = 'Refresh';

export default Refresh;