import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export interface EmptyStateProps {
  /**
   * Title of the empty state
   * @default 'Không có dữ liệu'
   */
  title?: string;
  
  /**
   * Detailed message explaining the empty state
   * @default 'Không tìm thấy kết quả nào phù hợp với tiêu chí tìm kiếm.'
   */
  message?: string;
  
  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;
  
  /**
   * Additional CSS class
   */
  className?: string;
  
  /**
   * Whether to animate the empty state
   * @default true
   */
  animate?: boolean;
  
  /**
   * Animation style for the empty state
   * @default 'fade-in'
   */
  animationStyle?: 'fade-in' | 'slide-up' | 'scale-in' | 'none';
  
  /**
   * Custom action button
   */
  action?: React.ReactNode;
  
  /**
   * Icon size 
   * @default 64
   */
  iconSize?: number | "sm" | "md" | "lg" | "xl";
  
  /**
   * Disable the icon entirely
   * @default false
   */
  hideIcon?: boolean;
}

export function EmptyState({
  title = 'Không có dữ liệu',
  message = 'Không tìm thấy kết quả nào phù hợp với tiêu chí tìm kiếm.',
  icon,
  className,
  animate = true,
  animationStyle = 'fade-in',
  action,
  iconSize = 64,
  hideIcon = false
}: EmptyStateProps): React.ReactElement {
  
  // Add a conversion function for the iconSize prop
  const getIconSizeValue = () => {
    if (typeof iconSize === 'number') return iconSize;
    
    switch(iconSize) {
      case 'sm': return 32;
      case 'md': return 48;
      case 'lg': return 64;
      case 'xl': return 80;
      default: return 64;
    }
  };
  
  // Animation variants based on style
  const getAnimationVariants = () => {
    switch (animationStyle) {
      case 'slide-up':
        return {
          container: {
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                when: "beforeChildren",
                staggerChildren: 0.2
              }
            }
          },
          item: {
            hidden: { y: 20, opacity: 0 },
            visible: {
              y: 0,
              opacity: 1
            }
          }
        };
        
      case 'scale-in':
        return {
          container: {
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                when: "beforeChildren",
                staggerChildren: 0.2
              }
            }
          },
          item: {
            hidden: { scale: 0.8, opacity: 0 },
            visible: {
              scale: 1,
              opacity: 1
            }
          }
        };
        
      case 'fade-in':
      default:
        return {
          container: {
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                when: "beforeChildren",
                staggerChildren: 0.1
              }
            }
          },
          item: {
            hidden: { opacity: 0 },
            visible: {
              opacity: 1
            }
          }
        };
    }
  };

  const { container: containerVariants, item: itemVariants } = getAnimationVariants();

  // Default empty state icon
  const defaultIcon = (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={getIconSizeValue()} 
      height={getIconSizeValue()} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );

  // If animations are disabled, render without motion
  if (!animate || animationStyle === 'none') {
    return (
      <div className={cn('rpt-empty-state', 'rpt-scrollable', className)}>
        {!hideIcon && (
          <div className="rpt-empty-icon">
            {icon || defaultIcon}
          </div>
        )}
        
        <h3 className="rpt-empty-title">
          {title}
        </h3>
        
        <p className="rpt-empty-message">
          {message}
        </p>
        
        {action && (
          <div className="rpt-empty-action">
            {action}
          </div>
        )}
      </div>
    );
  }

  // With animations
  return (
    <motion.div 
      className={cn('rpt-empty-state', 'rpt-scrollable', className)}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {!hideIcon && (
        <motion.div className="rpt-empty-icon" variants={itemVariants}>
          {icon || defaultIcon}
        </motion.div>
      )}
      
      <motion.h3 className="rpt-empty-title" variants={itemVariants}>
        {title}
      </motion.h3>
      
      <motion.p className="rpt-empty-message" variants={itemVariants}>
        {message}
      </motion.p>
      
      {action && (
        <motion.div className="rpt-empty-action" variants={itemVariants}>
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

export default EmptyState;