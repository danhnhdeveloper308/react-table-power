import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'Không có dữ liệu',
  message = 'Không tìm thấy kết quả nào phù hợp với tiêu chí tìm kiếm.',
  icon,
}: EmptyStateProps): React.ReactElement {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div 
      className={cn('rpt-empty-state')}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="rpt-empty-icon" variants={itemVariants}>
        {icon || (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="64" 
            height="64" 
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
        )}
      </motion.div>
      
      <motion.h3 className="rpt-empty-title" variants={itemVariants}>
        {title}
      </motion.h3>
      
      <motion.p className="rpt-empty-message" variants={itemVariants}>
        {message}
      </motion.p>
    </motion.div>
  );
}

export default EmptyState;