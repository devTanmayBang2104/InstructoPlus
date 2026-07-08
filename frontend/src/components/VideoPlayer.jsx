import React from 'react';
import myVideo from './video.mp4';

function VideoPlayer() {
  return (
    <div className="w-[300px] mx-auto p-4 absolute top-[55%] left-[60%]">
      <video
        src={myVideo}
        autoPlay
        loop
        className="w-full rounded-xl shadow-lg  border-2 border-white"
        muted
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default VideoPlayer;
