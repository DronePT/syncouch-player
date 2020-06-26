import { useState, useEffect } from 'react';
import { SyncouchAPI, VideoDimensions } from './SyncouchAPI';

interface SetupPlayerDeps {
  onPlayerReady?(video: SyncouchAPI): void;
  onPlay?(time?: number): void;
  onSeeked?(time?: number): void;
  onPause?(): void;
  onDimensionsReady?(dimensions: VideoDimensions): void;
  onVideoLoading?(): void;
  onVideoReady?(): void;
  onVolumeChange?(volume: number): void;
}

export const useSetupPlayer = (videoEl: HTMLVideoElement | null, deps: SetupPlayerDeps) => {
  const [subtitle, setSubtitle] = useState('');
  const [videoAPI, setVideoAPI] = useState<SyncouchAPI | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState({ current: 0, total: 0 });
  const [buffer, setBuffer] = useState<TimeRanges | undefined>(undefined);
  const [volume, setVolume] = useState(0);

  const {
    onDimensionsReady,
    onVideoLoading,
    onVideoReady,
    onPause,
    onPlay,
    onPlayerReady,
    onSeeked,
    onVolumeChange,
  } = deps;

  useEffect(() => {
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

    return () => {
      videoAPI.removeAllListeners('subtitle-enter');
      videoAPI.removeAllListeners('subtitle-exit');
      videoAPI.removeAllListeners('video-play');
      videoAPI.removeAllListeners('video-pause');
      videoAPI.removeAllListeners('video-time');
      videoAPI.removeAllListeners('video-seek');
      videoAPI.removeAllListeners('video-volume');
      videoAPI.removeAllListeners('video-duration');
      videoAPI.removeAllListeners('video-buffer');
      videoAPI.removeAllListeners('video-dimensions');
      videoAPI.removeAllListeners('video-ready');
      videoAPI.removeAllListeners('video-loading');
    };
  }, [videoEl]);

  return { subtitle, videoAPI, isPlaying, currentTime, buffer, volume };
};
