'use client';

import React from 'react';

export default function HostGuard() {
  React.useEffect(() => {
    try {
      const { origin, href } = window.location;
      if (origin.includes('localhost:3002')) {
        const next = href.replace('localhost:3002', '127.0.0.1:3002');
        if (next !== href) window.location.replace(next);
      }
    } catch {}
  }, []);
  return null;
}


