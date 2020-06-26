import React, { useRef, useMemo } from 'react';

import './SyncouchPlayer.scss';

import { SyncouchAPI, VideoDimensions } from '../libs/SyncouchAPI';
import { useSyncouchVideoActions } from '../libs/SyncouchActions';

// Components
import SyncouchControls from './SyncouchControls';
import { Subtitle } from './SyncouchSubtitles';
import { useSetupSubtitles, useAccessibility } from '../libs';
import { useSetupPlayer } from '../libs/useSetupPlayer';
import clsx from 'clsx';

interface SyncouchPlayerProps {
  children?: React.ReactNode;
  src: string;
  type?: string;
  label?: string;
  title?: string;
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
  title,
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

  const { subtitle, videoAPI, isPlaying, currentTime, buffer, volume } = useSetupPlayer(
    videoRef.current,
    {
      onDimensionsReady,
      onPause,
      onPlay,
      onPlayerReady,
      onSeeked,
      onVideoLoading,
      onVideoReady,
      onVolumeChange,
    }
  );

  const syncouchVideoActions = useSyncouchVideoActions(videoAPI, videoPlayerRef.current);

  const { isFullScreen, isControlsVisible } = useAccessibility(videoAPI, {
    syncouchVideoActions,
  });

  useSetupSubtitles(subtitles, videoRef.current, videoAPI);

  const titleStyling = useMemo(() => {
    return clsx('syncouch-title', {
      'is-visible': isControlsVisible,
    });
  }, [isControlsVisible]);

  return (
    <div className="syncouch-player" ref={videoPlayerRef}>
      {title && <div className={titleStyling}>{title}</div>}
      <video id="syncouch-video" ref={videoRef}>
        {videoAPI && <source src={src} type={type || 'video/mp4'}></source>}
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
