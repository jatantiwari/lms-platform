'use client';

import { useEffect } from 'react';

/** Disables right-click context menu across the entire site. */
export default function NoRightClick() {
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  return null;
}
