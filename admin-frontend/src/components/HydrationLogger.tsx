'use client';

import { useEffect } from 'react';

export function HydrationLogger() {
  useEffect(() => {
    // Log hydration-related styles
    const bodyStyles = window.getComputedStyle(document.body);
    const vscDomain = bodyStyles.getPropertyValue('--vsc-domain');
    console.log('HydrationLogger: Client-side body styles --vsc-domain:', vscDomain);

    // Check for VSCode-specific styles
    const allStyles = document.querySelectorAll('style');
    allStyles.forEach((style, index) => {
      if (style.textContent?.includes('--vsc-domain')) {
        console.log(`HydrationLogger: VSCode style found in style tag ${index}:`, style.textContent);
      }
    });
  }, []);

  return null;
}