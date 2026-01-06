import React from 'react';

const SkeletonHome = () => {
  return (
    <div className="bg-[#0b0c0f] min-h-screen w-full animate-pulse overflow-hidden">
      {/* Navbar Skeleton */}
      <div className="h-16 w-full bg-gray-900/50 flex items-center justify-between px-12 border-b border-gray-800">
        <div className="h-8 w-32 bg-gray-800 rounded"></div>
        <div className="flex gap-4">
            <div className="h-8 w-20 bg-gray-800 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="relative h-[70vh] w-full bg-gray-900 flex items-center px-12">
         <div className="space-y-4 max-w-2xl w-full mt-20">
             <div className="flex gap-2">
                 <div className="h-6 w-16 bg-gray-800 rounded"></div>
                 <div className="h-6 w-12 bg-gray-800 rounded"></div>
             </div>
             <div className="h-16 w-3/4 bg-gray-800 rounded"></div>
             <div className="h-4 w-full bg-gray-800 rounded"></div>
             <div className="h-4 w-2/3 bg-gray-800 rounded"></div>
             <div className="flex gap-4 pt-4">
                 <div className="h-12 w-32 bg-gray-700 rounded"></div>
                 <div className="h-12 w-32 bg-gray-800 rounded"></div>
             </div>
         </div>
      </div>

      {/* Movie Rows Skeleton */}
      <div className="space-y-8 px-12 py-8 -mt-20 relative z-10">
        {[1, 2, 3].map((row) => (
            <div key={row} className="space-y-4">
                <div className="h-6 w-48 bg-gray-800 rounded"></div>
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map((card) => (
                        <div key={card} className="w-[200px] h-[300px] bg-gray-800 rounded-xl flex-shrink-0 relative">
                             <div className="absolute bottom-4 left-4 right-4 space-y-2">
                                 <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
                                 <div className="h-3 w-1/2 bg-gray-700 rounded"></div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonHome;