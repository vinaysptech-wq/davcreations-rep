import React from 'react';
import Image from 'next/image';
import { useAuth } from '../../auth/hooks/useAuth';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <Image src="/assets/logos/Square logo.jpg" alt="Dav Creations Logo" width={64} height={64} className="mb-2" />
        {user && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </span>
            <span className="text-xs text-gray-500 uppercase">
              {user.user_type_name}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 max-w-md mx-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-600 hover:text-blue-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 0112 21c7.962 0 12-1.21 12-2.683m-12 2.683a17.925 17.925 0 01-7.132-8.317M12 21V9m0 0a9 9 0 109 9H3a9 9 0 009-9z" />
          </svg>
        </button>
        <button className="text-gray-600 hover:text-blue-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>
    </header>
  );
}