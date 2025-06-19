/**
 * Utility for detecting scrollbar hover and applying styles
 */

export function enableScrollbarHoverDetection(element: HTMLElement) {
  if (!element) return;

  let isHoveringScrollbar = false;

  element.addEventListener('mousemove', (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const scrollbarWidth = element.offsetWidth - element.clientWidth;
    const scrollbarHeight = element.offsetHeight - element.clientHeight;
    
    // Check if mouse is over vertical scrollbar
    const isOverVerticalScrollbar = 
      e.clientX >= rect.right - scrollbarWidth && 
      e.clientX <= rect.right &&
      scrollbarWidth > 0;
    
    // Check if mouse is over horizontal scrollbar
    const isOverHorizontalScrollbar = 
      e.clientY >= rect.bottom - scrollbarHeight && 
      e.clientY <= rect.bottom &&
      scrollbarHeight > 0;

    const shouldHover = isOverVerticalScrollbar || isOverHorizontalScrollbar;

    if (shouldHover && !isHoveringScrollbar) {
      isHoveringScrollbar = true;
      element.classList.add('rpt-scrollbar-hover-detected');
    } else if (!shouldHover && isHoveringScrollbar) {
      isHoveringScrollbar = false;
      element.classList.remove('rpt-scrollbar-hover-detected');
    }
  });

  element.addEventListener('mouseleave', () => {
    isHoveringScrollbar = false;
    element.classList.remove('rpt-scrollbar-hover-detected');
  });
}
