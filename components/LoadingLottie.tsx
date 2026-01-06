import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-player': any;
    }
  }
}

const LoadingLottie = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#0b0c0f]">
      <dotlottie-player
        src="https://lottie.host/640ed545-3add-4b3b-a6ff-cf8aadcdcf4c/p6MKGROtaN.lottie"
        background="transparent"
        speed="1"
        style={{ width: '300px', height: '300px' }}
        loop
        autoplay
      ></dotlottie-player>
      <p className="text-[#1ce783] font-bold mt-4 animate-pulse tracking-widest text-sm">MEMUAT STREAM...</p>
    </div>
  );
};

export default LoadingLottie;