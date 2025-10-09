import React from 'react';

interface HamburgerMenuProps {
  onClick: () => void;
}

export default function HamburgerMenu({ onClick }: HamburgerMenuProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed top-4 right-4 z-10 bg-blue-600 text-white p-2 rounded shadow-lg"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}