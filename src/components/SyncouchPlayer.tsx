import React, { useRef, useEffect, useState } from 'react';
import { debounce } from 'lodash';

import './SyncouchPlayer.scss';

import { SyncouchAPI, VideoDimensions } from '../libs/SyncouchAPI';
import { useSyncouchVideoActions } from '../libs/SyncouchActions';

// Components
import SyncouchControls from './SyncouchControls';
import { Subtitle } from './SyncouchSubtitles';

interface SyncouchPlayerProps {
  children?: React.ReactNode;
  src: string;
  type?: string;
  label?: string;
  subtitles?: Subtitle[];
  onPlayerReady?(video: SyncouchAPI): void;
  onPlay?(time?: number): void;
  onSeeked?(time?: number): void;
  onPause?(): void;
  onDimensionsReady?(dimensions: VideoDimensions): void;
  onVideoLoading?(): void;
  onVideoReady?(): void;
  onVolumeChange?(volume: number): void;
  onSubtitleFromPc?(files: FileList): void;
}

const SyncouchPlayer: React.FC<SyncouchPlayerProps> = ({
  src,
  type,
  label,
  onPlay,
  onPause,
  onSeeked,
  children,
  subtitles,
  onVideoReady,
  onPlayerReady,
  onVideoLoading,
  onVolumeChange,
  onSubtitleFromPc,
  onDimensionsReady,
}) => {
  const videoPlayerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [subtitle, setSubtitle] = useState('');
  const [videoAPI, setVideoAPI] = useState<SyncouchAPI | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState({ current: 0, total: 0 });
  const [buffer, setBuffer] = useState<TimeRanges | undefined>(undefined);
  const [volume, setVolume] = useState(0);

  const syncouchVideoActions = useSyncouchVideoActions(videoAPI, videoPlayerRef.current);

  const videoEl = videoRef.current;

  useEffect(() => {
    // effect
    if (!videoEl || !videoAPI) return;

    let shouldSetupSubtitles = false;

    subtitles?.forEach((sub) => {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = sub.label;
      track.srclang = sub.lang;
      track.src = sub.src;

      track.addEventListener('load', () => {
        console.warn('[track loaded]');
      });

      videoEl.appendChild(track);

      shouldSetupSubtitles = true;
    });

    if (shouldSetupSubtitles) videoAPI?.setupSubtitles();

    return () => {
      for (const i in videoEl.children) {
        const child = videoEl.children.item(parseInt(i));

        if (child?.nodeName.toLowerCase() === 'track') {
          child.remove();
        }
      }
    };
  }, [subtitles, videoEl, videoAPI]);

  useEffect(() => {
    // effect
    const { current: videoEl } = videoRef;

    if (!videoEl) return;

    const videoAPI = new SyncouchAPI(videoEl);

    setVideoAPI(videoAPI);

    onPlayerReady?.(videoAPI);

    setVolume(videoAPI.getVolume());

    videoAPI.addListener('subtitle-enter', (text) => setSubtitle(text));
    videoAPI.addListener('subtitle-exit', () => setSubtitle(''));
    videoAPI.addListener('video-play', () => {
      setIsPlaying(true);
      onPlay?.(videoAPI.getCurrentTime());
    });
    videoAPI.addListener('video-pause', () => {
      setIsPlaying(false);
      onPause?.();
    });
    videoAPI.addListener('video-time', (time) => setCurrentTime(time));
    videoAPI.addListener('video-seek', (time) => {
      setCurrentTime(time);
      onSeeked?.(time.current);
    });
    videoAPI.addListener('video-volume', (volume) => {
      onVolumeChange?.(volume);
      setVolume(volume);
    });
    videoAPI.addListener('video-duration', (time) => setCurrentTime(time));
    videoAPI.addListener('video-buffer', (buf) => setBuffer(buf));
    videoAPI.addListener('video-dimensions', (dimensions) => onDimensionsReady?.(dimensions));
    videoAPI.addListener('video-ready', () => onVideoReady?.());
    videoAPI.addListener('video-loading', () => onVideoLoading?.());
  }, [videoRef]);

  useEffect(() => {
    let lx = 0;
    let ly = 0;
    let isMoving = false;

    const hideControls = debounce(() => {
      setIsControlsVisible(false);
    }, 5 * 1000);

    const showControls = () => {
      setIsControlsVisible(true);
      hideControls();
    };

    const mouseMoveHandler = debounce((event: MouseEvent) => {
      const dx = Math.abs(event.clientX - lx);
      const dy = Math.abs(event.clientY - ly);

      isMoving = dx > 1 || dy > 1;

      if (isMoving) {
        showControls();
      }

      lx = event.clientX;
      ly = event.clientY;
    }, 50);

    const keyUpDownHandler = (event: KeyboardEvent) => {
      if (!videoAPI) return;

      showControls();

      const { code, type, shiftKey } = event;

      switch (true) {
        case type === 'keyup' && code === 'Space':
          syncouchVideoActions.playPauseHandler();
          break;
        case type === 'keyup' && code === 'KeyF':
          syncouchVideoActions.fullScreenClickHandler();
          break;
        case type === 'keyup' && code === 'KeyM':
          videoAPI.toggleMute();
          break;
        case type === 'keyup' && code === 'Escape':
          setIsControlsVisible(false);
          break;
        case type === 'keyup' && /Digit[0-9]{1}/i.test(code) && shiftKey:
          videoAPI.changeVolume(parseInt(code.replace('Digit', '')) * 10);
          break;
        case type === 'keyup' && /Digit[0-9]{1}/i.test(code) && !shiftKey:
          videoAPI.seekTo(videoAPI.getDuration() * (parseInt(code.replace('Digit', '')) / 10));
          break;
        case type === 'keydown' && code === 'ArrowLeft':
          videoAPI.seekTo(videoAPI.getCurrentTime() - 10);
          break;
        case type === 'keydown' && code === 'ArrowRight':
          videoAPI.seekTo(videoAPI.getCurrentTime() + 10);
          break;
        case type === 'keydown' && code === 'ArrowUp':
          videoAPI.changeVolume(videoAPI.getVolume() + 1);
          break;
        case type === 'keydown' && code === 'ArrowDown':
          videoAPI.changeVolume(videoAPI.getVolume() - 1);
          break;
        default:
          break;
      }
    };

    const windowResizeHandler = debounce(() => {
      if (
        window.innerWidth === screen.width &&
        window.innerHeight === screen.height &&
        !document.fullscreenElement
      ) {
        syncouchVideoActions.fullScreenClickHandler();
      }
    }, 250);

    const fullScreenHandler = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    window.addEventListener('resize', windowResizeHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('keyup', keyUpDownHandler);
    document.addEventListener('keydown', keyUpDownHandler);
    document.addEventListener('fullscreenchange', fullScreenHandler);

    return () => {
      window.removeEventListener('resize', windowResizeHandler);
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('keyup', keyUpDownHandler);
      document.removeEventListener('keydown', keyUpDownHandler);
      document.removeEventListener('fullscreenchange', fullScreenHandler);
    };
  }, [videoAPI]);

  return (
    <div className="syncouch-player" ref={videoPlayerRef}>
      <video id="syncouch-video" ref={videoRef}>
        <source src={src} type={type || 'video/mp4'}></source>
      </video>

      <div className="video-subtitles" dangerouslySetInnerHTML={{ __html: subtitle }}></div>

      <SyncouchControls
        label={label}
        volume={volume}
        isVisible={isControlsVisible}
        isPlaying={isPlaying}
        currentTime={currentTime}
        buffer={buffer}
        subtitles={subtitles}
        isFullScreen={isFullScreen}
        onPlayPauseClick={syncouchVideoActions.playPauseHandler}
        onSeek={syncouchVideoActions.videoSeekHandler}
        onFullScreenClick={syncouchVideoActions.fullScreenClickHandler}
        onSubtitleClick={syncouchVideoActions.subtitleClickHandler}
        onVolumeChange={syncouchVideoActions.volumeChangeHandler}
        onSubtitleFromPc={onSubtitleFromPc}
      />

      <div className="syncouch-player--content">{children}</div>
    </div>
  );
};

export default React.memo(SyncouchPlayer);
