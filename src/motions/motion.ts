/**
 * React Power Table - Motion Animations
 * Animation configurations for table components using Framer Motion
 */

import { Variants } from 'framer-motion';

// Fade animation variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.1 }
  },
};

// Slide up animation variants
export const slideUpVariants: Variants = {
  hidden: {
    y: 20,
    opacity: 0
  },
  visible: (custom = 0) => ({
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
      delay: typeof custom === 'number' ? custom : 0
    }
  }),
  exit: {
    y: 20,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

// Scale fade animation variants (for dropdowns)
export const scaleFadeVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transformOrigin: 'top'
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.2
    }
  }
};

// Slide from right animation variants (for drawers/sidebars)
export const slideFromRightVariants: Variants = {
  hidden: {
    x: '100%',
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  }
};

// Modal animation variants
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

// Backdrop animation variants
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      delay: 0.1
    }
  }
};

// Loading spinner animation variant
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity
    }
  }
};

// Create staggered children animations
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

// Tooltip animation variants
export const tooltipVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 5
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    y: 5,
    scale: 0.95,
    transition: {
      duration: 0.15
    }
  }
};

// Toast notification variants
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.8
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Toolbar animation variants for fade-in effect
 */
export const toolbarVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: -10,
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
      mass: 1,
      duration: 0.3,
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 }
  },
};

/**
 * Table container animation variants
 */
export const tableContainerVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.98,
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.05
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.2 }
  }
};

/**
 * Table row animation variants with staggered children
 * Enhanced with custom delay based on row index
 */
export const tableRowVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: -10
  },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      delay: custom * 0.05 // Staggered delay based on row index
    }
  }),
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  },
  updated: {
    backgroundColor: ['rgba(49, 138, 248, 0.2)', 'rgba(49, 138, 248, 0)'],
    transition: {
      duration: 2,
      times: [0, 1],
      ease: 'easeOut'
    }
  }
};

/**
 * Dropdown menu animation variants
 */
export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -5,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      mass: 0.5,
      staggerChildren: 0.03,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: -5,
    scale: 0.98,
    transition: {
      duration: 0.15
    }
  }
};

/**
 * Dialog/modal animation variants
 */
export const dialogVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.9,
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
      mass: 1.2,
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

/**
 * Dialog overlay animation variants
 */
export const dialogOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Pagination controls animation variants
 */
export const paginationControlsVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 10,
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
      mass: 0.8,
    }
  }
};

/**
 * Actions button animation variants
 */
export const actionButtonVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    }
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.15
    }
  },
  tap: {
    scale: 0.95
  }
};

/**
 * Filter panel animation variants
 */
export const filterPanelVariants: Variants = {
  hidden: { 
    opacity: 0,
    height: 0,
    padding: 0,
    marginTop: 0,
    overflow: 'hidden',
  },
  visible: { 
    opacity: 1,
    height: 'auto',
    padding: '1rem',
    marginTop: '0.5rem',
    transition: {
      height: {
        duration: 0.3,
      },
      opacity: {
        duration: 0.25,
        delay: 0.05
      }
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    padding: 0,
    marginTop: 0,
    transition: {
      height: {
        duration: 0.2,
      },
      opacity: {
        duration: 0.15,
      }
    }
  }
};

/**
 * Search input animation variants
 */
export const searchInputVariants: Variants = {
  idle: {
    boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)'
  },
  focus: {
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Column visibility dropdown variants
 */
export const columnVisibilityVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transformOrigin: 'top right',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 350,
      when: 'beforeChildren',
      staggerChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Animation variants for the column visibility items
 */
export const columnItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10,
  },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.2,
    },
  }),
};

/**
 * Animation variants for expanding/collapsing content
 */
export const expandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    overflow: 'visible',
    transition: {
      height: {
        duration: 0.3,
      },
      opacity: {
        duration: 0.25,
        delay: 0.05,
      },
    },
  },
};

/**
 * SlideDown animation variants for elements entering from above
 */
export const slideDownVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: -10
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * SlideIn from left animation variants
 */
export const slideInLeftVariants: Variants = {
  hidden: { 
    opacity: 0,
    x: -20
  },
  visible: (custom = 0) => ({ 
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
      delay: typeof custom === 'number' ? custom : 0
    }
  }),
  exit: { 
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * SlideIn from right animation variants
 */
export const slideInRightVariants: Variants = {
  hidden: { 
    opacity: 0,
    x: 20
  },
  visible: (custom = 0) => ({ 
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
      delay: typeof custom === 'number' ? custom : 0
    }
  }),
  exit: { 
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Animation variants for sliding elements in from the side
 */
export const slideInVariants: Variants = {
  hidden: (direction: 'left' | 'right' = 'right') => ({
    x: direction === 'right' ? 20 : -20,
    opacity: 0,
  }),
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: (direction: 'left' | 'right' = 'right') => ({
    x: direction === 'right' ? 20 : -20,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  }),
};

/**
 * Notification animation variants
 */
export const notificationVariants: Variants = {
  hidden: { 
    opacity: 0,
    x: 50,
    y: 0
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30
    }
  },
  exit: { 
    opacity: 0,
    x: 50,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Menu/dropdown animation variants
 */
export const menuVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -5
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 800,
      damping: 35
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transition: {
      duration: 0.15
    }
  }
};

/**
 * Accordion animation variants for content
 */
export const accordionContentVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: {
        type: 'spring',
        stiffness: 500,
        damping: 30,
        duration: 0.3
      },
      opacity: {
        duration: 0.2,
        delay: 0.1
      }
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: {
        duration: 0.3
      },
      opacity: {
        duration: 0.2
      }
    }
  }
};

/**
 * List item stagger animation variants
 */
export const listItemVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 10
  },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: typeof custom === 'number' ? custom * 0.05 : 0,
      duration: 0.3,
      ease: 'easeOut'
    }
  }),
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Animation variants for table row actions
 */
export const tableRowActionVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  visible: (custom = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: typeof custom === 'number' ? custom * 0.05 : 0,
      type: 'spring',
      stiffness: 700,
      damping: 30
    }
  }),
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.15
    }
  }
};

/**
 * Table row expand animation variants for detail panels
 */
export const tableRowExpandVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        duration: 0.3
      },
      opacity: {
        duration: 0.2,
        delay: 0.1
      }
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: {
        duration: 0.25
      },
      opacity: {
        duration: 0.15
      }
    }
  }
};

/**
 * Card/panel hover animation variants
 */
export const hoverCardVariants: Variants = {
  initial: {
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    transition: {
      duration: 0.3
    }
  },
  hover: {
    boxShadow: '0 14px 28px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.05)',
    y: -5,
    transition: {
      duration: 0.3
    }
  },
  tap: {
    boxShadow: '0 3px 6px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.05)',
    y: 0,
    scale: 0.98,
    transition: {
      duration: 0.3
    }
  }
};

/**
 * Row animation variants with staggered delay
 */
export const rowVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 10
  },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delay: custom * 0.05, // Stagger delay based on row index
      ease: 'easeOut'
    }
  }),
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Badge animation for showing counts
 */
export const badgeVariants: Variants = {
  initial: { 
    scale: 0  
  },
  animate: { 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25
    }
  },
  exit: { 
    scale: 0,
    transition: {
      duration: 0.15
    }
  }
};

/**
 * Selection toolbar animation
 */
export const selectionToolbarVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: -10
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Updated row highlight animation
 */
export const updatedRowVariants: Variants = {
  initial: { 
    backgroundColor: 'rgba(59, 130, 246, 0.2)' 
  },
  animate: { 
    backgroundColor: 'transparent',
    transition: {
      duration: 2,
      ease: 'easeOut'
    }
  }
};

/**
 * Generate staggered child variants
 */
export const generateStaggeredChildVariants = (staggerDelay: number = 0.05): Variants => ({
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * staggerDelay,
      duration: 0.3,
      ease: 'easeOut'
    }
  }),
  exit: { opacity: 0, transition: { duration: 0.2 } }
});

/**
 * Check if CSS animations are preferred
 */
export const prefersCSSAnimations = (): boolean => {
  // Check if user prefers reduced motion
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

export default {
  dropdownVariants,
  rowVariants,
  columnItemVariants,
  badgeVariants,
  selectionToolbarVariants,
  updatedRowVariants,
  generateStaggeredChildVariants,
  prefersCSSAnimations
};