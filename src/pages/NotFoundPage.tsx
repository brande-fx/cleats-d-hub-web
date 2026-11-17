import React from 'react';
import {Link} from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <p className="font-mono-num text-sm font-semibold text-[#FD7B41]">404</p>
      <h1 className="font-display text-3xl font-extrabold text-[#1F2225]">Page not found</h1>
      <p className="text-sm text-[#3C4044]/80">
        The page you requested could not be found. Return to the footwear storefront to continue browsing.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center px-5 py-2.5 bg-[#FD7B41] hover:bg-[#fc6b2b] text-[#1F2225] font-semibold text-sm rounded-md transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};
