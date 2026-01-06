import React from 'react';

const SkeletonHome = () => {
  return (
    <div className="bg-[#0b0c0f] min-h-screen w-full animate-pulse overflow-hidden">
      {/* Navbar Placeholder */}
      <div className="flex items-center justify-between px-12 py-6">
        <div className="h-8 w-32 bg-gray-800 rounded"></div>
        <div className="flex gap-6">
          <div className="h-4 w-16 bg-gray-800 rounded"></div>
          <div className="h-4 w-16 bg-gray-800 rounded"></div>
          <div className="h-4 w-16 bg-gray-800 rounded"></div>
        </div>
        <div className="flex gap-4">
           <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
           <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
        </div>
      </div>

      {/* Hero Banner Placeholder */}
      <div className="relative w-full h-[70vh] md:h-[80vh] bg-gray-900">
        <div className="absolute bottom-0 left-0 p-12 w-full space-y-6">
           <div className="h-4 w-48 bg-gray-800 rounded"></div>
           <div className="h-12 w-1/2 bg-gray-800 rounded"></div>
           <div className="h-20 w-1/3 bg-gray-800 rounded"></div>
           <div className="flex gap-4">
              <div className="h-12 w-32 bg-gray-700 rounded"></div>
              <div className="h-12 w-12 bg-gray-700 rounded"></div>
           </div>
        </div>
      </div>

      {/* Movie Rows Placeholders */}
      <div className="relative z-10 -mt-24 space-y-12 px-12 pb-12">
        {[1, 2, 3].map((row) => (
          <div key={row} className="space-y-4">
            <div className="h-6 w-48 bg-gray-800 rounded"></div>
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((card) => (
                <div key={card} className="flex-shrink-0 w-[200px] h-[300px] bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonHome;