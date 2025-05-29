import { useEffect } from 'react';

export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, isActive: boolean = true) {
  useEffect(() => {
    if (!containerRef) return

    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    const focusableSelectors = [
      'a[href]', 'area[href]', 'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])', 'textarea:not([disabled])',
      'button:not([disabled])', 'iframe', 'object', 'embed',
      '[tabindex]:not([tabindex="-1"])', '[contenteditable]'
    ].join(',');

    const getFocusableElements = () => {
      const elements = container.querySelectorAll<HTMLElement>(focusableSelectors);
      return Array.from(elements).filter(el => el.offsetParent !== null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
}
