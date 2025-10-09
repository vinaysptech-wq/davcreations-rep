import React from 'react';
import Link from 'next/link';

export default function Breadcrumb() {
  return (
    <nav className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        <li>
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
        </li>
        <li className="text-gray-400">/</li>
        <li className="text-gray-900 font-medium">Current Page</li>
      </ol>
    </nav>
  );
}