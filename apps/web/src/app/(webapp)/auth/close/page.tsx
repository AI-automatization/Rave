'use client';

import { useEffect } from 'react';

// This page is opened inside the Google auth popup via popup.location.href.
// Once loaded on our origin, it immediately closes the popup window.
export default function AuthClosePage() {
  useEffect(() => {
    window.close();
  }, []);

  return (
    <div style={{ display: 'none' }} />
  );
}
