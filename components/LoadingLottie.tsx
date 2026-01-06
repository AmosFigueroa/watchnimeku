import React from 'react';

const LoadingLottie = () => {
  // Use a variable with 'any' type to bypass TypeScript IntrinsicElements check for the custom web component
  const DotLottiePlayer = 'dotlottie-player' as any;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#0b0c0f]">
      <DotLottiePlayer
        src="https://lottie.host/640ed545-3add-4b3b-a6ff-cf8aadcdcf4c/p6MKGROtaN.lottie"
        background="transparent"
        speed="1"
        style={{ width: '300px', height: '300px' }}
        loop
        autoplay
      ></DotLottiePlayer>
      <p className="text-[#1ce783] font-bold mt-4 animate-pulse tracking-widest text-sm">MEMUAT STREAM...</p>
    </div>
  );
};

export default LoadingLottie;