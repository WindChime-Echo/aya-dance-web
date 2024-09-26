import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { delay } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { nextVideoWithRandom, selectPlayList } from "@/store/modules/playList";
import styles from "./index.module.css";
import { selectSongInfo } from "@/store/modules/songInfo";

enum DoubleWidthShowMode {
  Both, Original, Simplified
}

interface VideoPlayerProps {
}

const formatDoubleWidthShowMode = (mode: DoubleWidthShowMode) => {
  switch (mode) {
    case DoubleWidthShowMode.Both:
      return "全部";
    case DoubleWidthShowMode.Original:
      return "原版";
    case DoubleWidthShowMode.Simplified:
      return "简化";
  }
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({}) => {
  const { playList } = useSelector(selectPlayList);
  const { songTypes } = useSelector(selectSongInfo);
  const dispatch = useDispatch();
  const queue = useMemo(() => playList[0] ?? null, [playList]);
  const onVideoEnded = useCallback(() => {
    console.log("onVideoEnded");
    dispatch(nextVideoWithRandom(songTypes.find(t => t.title === "All Songs")?.entries ?? []));
  }, []);
  const [doubleWidthShowMode, setDoubleWidthShowMode] = useState<DoubleWidthShowMode>(DoubleWidthShowMode.Original);

  const videoUrl = queue ? `https://api.udon.dance/Api/Songs/play?id=${queue.video.id}` : "";
  const flip = queue?.video.flip ?? false;
  const doubleWidth = queue?.video.doubleWidth ?? false;
  const volume = queue?.video.volume ?? 0.514;

  const videoInfo = queue ? `${queue.video.id}. ${queue.video.composedTitle} ${doubleWidth ? `(${formatDoubleWidthShowMode(doubleWidthShowMode)})` : ""} ${queue.isRandom ? "(随机)" : ""}` : "";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const plyrInstance = useRef<Plyr | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

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
      plyrInstance.current.on("loadeddata", () => {
        // This enforces the video to play when the video is loaded;
        // the "autoplay" option works only on the first video,
        // for videos that are loaded after the first one, we need to call play() manually

        // SetTimeout is not reliable, let's compute Date on our own
        const now = Date.now();

        // The Y-combinator
        // const Y = (f: any) => (g => g(g))((g: any) => f((x: any) => g(g)(x)))

        const resumePlay = () => {
          const elapsed = Date.now() - now;
          console.log(`Elapsed milliseconds: ${elapsed}, waiting until it reaches 10000`);
          if (elapsed >= 10 * 1000) {
            plyrInstance.current?.play();
          } else {
            // WOW! Dynamic scoping! No Y-combinator needed!
            delay(resumePlay, 1000);
          }
        };

        delay(resumePlay, 1000);
      });
      plyrInstance.current.on("enterfullscreen", () => {
        if (overlayRef.current) {
          overlayRef.current.style.display = "block";
        }
      });
      plyrInstance.current.on("exitfullscreen", () => {
        if (overlayRef.current) {
          overlayRef.current.style.display = "none";
        }
      });

      muteAndUnmuteAfterDelay();
      applyScreenEffect();
      // This enforces the video to reload when the videoUrl changes
      videoRef.current.load();
      if (overlayRef.current) {
        videoRef.current?.parentElement?.parentElement?.append(overlayRef.current);
      }
    }
  }, [videoUrl]);

  const muteAndUnmuteAfterDelay = (delay = 1000) => {
    if (plyrInstance.current) {
      plyrInstance.current.muted = true;
      setTimeout(() => {
        if (plyrInstance.current) {
          plyrInstance.current.muted = false;
          plyrInstance.current.volume = volume;
        }
      }, delay);
    }
  };

  const applyScreenEffect = () => {
    if (videoRef.current) {
      const wrapper = videoRef.current.closest(
        ".plyr__video-wrapper"
      ) as HTMLElement;
      if (wrapper) {
        console.log(`Applying screen effect for flip=${flip}, doubleWidth=${doubleWidth}, doubleWidthShowMode=${doubleWidthShowMode}`);
        let scaleX = flip ? -1 : 1;
        let scaleY = 1;
        let translateX = 0;
        if (doubleWidth && doubleWidthShowMode === DoubleWidthShowMode.Original) {
          scaleX = flip ? -2 : 2;
          translateX = 25;
        }
        if (doubleWidth && doubleWidthShowMode === DoubleWidthShowMode.Simplified) {
          scaleX = flip ? -2 : 2;
          translateX = -25;
        }
        if (doubleWidth && doubleWidthShowMode === DoubleWidthShowMode.Both) {
          scaleY = 0.5;
        }

        wrapper.style.transform = `scaleX(${scaleX}) scaleY(${scaleY}) translateX(${translateX}%)`;
      }
    }
  };

  return (
    <div className="w-full h-full">
      <h1
        className="mb-4 text-4xl font-extrabold text-center leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
        {videoInfo}
      </h1>
      <div ref={overlayRef}
           className={`${styles.overlay} mb-4 text-4xl font-extrabold text-center leading-none tracking-tight bg-gray-500 bg-opacity-50 text-white hidden`}>
        <h1>{videoInfo}</h1>
      </div>
      <video ref={videoRef} controls className="plyr__video-embed">
        <source src={videoUrl} type="video/mp4" className=" w-full h-full" />
      </video>
      <span>Flip: {flip ? "true" : "false"}, Combined: {doubleWidth ? "true" : "false"}</span>
    </div>
  );
};

export default VideoPlayer;
