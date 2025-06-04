import { SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  /**
   * Icon size in pixels
   */
  size?: number;
  
  /**
   * CSS class name for styling
   */
  className?: string;
  
  /**
   * Color of the icon (uses currentColor by default)
   */
  color?: string;
}