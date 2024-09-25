import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { delay } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { nextVideo, selectPlayList } from "@/store/modules/playList";

interface VideoPlayerProps {
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
}) => {
  const { playList } = useSelector(selectPlayList);
  const dispatch = useDispatch();
  const video = useMemo(() => playList[0] ?? null, [playList]);
  const onVideoEnded = useCallback(() => {
    console.log("onVideoEnded");
    dispatch(nextVideo());
  }, []);

  const videoUrl = video ? `https://api.udon.dance/Api/Songs/play?id=${video.id}` : "";
  const flip = video?.flip ?? false;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const plyrInstance = useRef<Plyr | null>(null);

  useEffect(() => {
    if (videoUrl === "") return;

    console.log("Got new video url", videoUrl);
    if (videoRef.current) {
      plyrInstance.current = new Plyr(videoRef.current, {
        // IMPORTANT: no autoplay/autopause here, we will handle it manually,
        // or race condition happens when the first video is loaded:
        // the video starts to play, and seconds later the video is paused.
        autoplay: false,
        autopause: false
      });

      plyrInstance.current.on("ended", () => onVideoEnded());
      plyrInstance.current.on("canplay", () => {
        // This enforces the video to play when the video is loaded;
        // the "autoplay" option works only on the first video,
        // for videos that are loaded after the first one, we need to call play() manually
        delay(() => {
          if (plyrInstance.current) {
            plyrInstance.current.play();
          }
        }, 10000);
      });

      muteAndUnmuteAfterDelay();
      applyFlipEffect();
      // This enforces the video to reload when the videoUrl changes
      videoRef.current.load();
    }
  }, [videoUrl]);

  const muteAndUnmuteAfterDelay = (delay = 1000) => {
    if (plyrInstance.current) {
      plyrInstance.current.muted = true;
      setTimeout(() => {
        if (plyrInstance.current) {
          plyrInstance.current.muted = false;
          plyrInstance.current.volume = 1;
        }
      }, delay);
    }
  };

  const applyFlipEffect = () => {
    if (videoRef.current) {
      const wrapper = videoRef.current.closest(
        ".plyr__video-wrapper"
      ) as HTMLElement;
      if (wrapper) {
        wrapper.style.transform = flip ? "scaleX(-1)" : "scaleX(1)";
      }
    }
  };

  return (
    <div className="w-full h-full">
      <h1
        className="mb-4 text-4xl font-extrabold text-center leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
        {video && `${video.id}. ${video.composedTitle}`}
      </h1>
      <video ref={videoRef} controls className="plyr__video-embed">
        <source src={videoUrl} type="video/mp4" className=" w-full h-full" />
      </video>
    </div>
  );
};

export default VideoPlayer;
