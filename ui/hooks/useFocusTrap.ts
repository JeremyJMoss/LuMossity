"use client"
//----------Dependencies----------//
import { useEffect, useCallback } from 'react';
//----------End Dependencies----------//

//----------Constants----------//
const focusableSelectors = [
  'a[href]', 'area[href]', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])',
  'button:not([disabled])', 'iframe', 'object', 'embed',
  '[tabindex]:not([tabindex="-1"])', '[contenteditable]'
].join(',');
//----------End Constants----------//

function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, isActive: boolean = true) {
  //----------Helpers----------//
  const getFocusableElements = () => {
    const container = containerRef.current;
    const elements = container?.querySelectorAll<HTMLElement>(focusableSelectors) ?? [];
    return Array.from(elements).filter(el => el.offsetParent !== null);
  };
  //----------End Helpers----------//

  //----------Handlers----------//
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  }, [containerRef]);
  //----------End Handlers----------//

  //----------Effects----------//
  useEffect(() => {
    if (!isActive || !containerRef?.current) return;

    document.addEventListener('keydown', handleKeyDown);

    const focusableElements = getFocusableElements()
    ;
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleKeyDown]);
  //----------End Effects----------//
}

//----------Exports----------//
export {useFocusTrap};
//----------End Exports----------//

