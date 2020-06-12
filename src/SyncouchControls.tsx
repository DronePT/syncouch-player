import React from 'react';
import clsx from 'clsx';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faExpand,
  faCompress,
  faClosedCaptioning,
} from '@fortawesome/free-solid-svg-icons';

// Components
import SyncouchProgress from './SyncouchProgress';

import './SyncouchControls.scss';
import SyncouchSubtitles, { Subtitle } from './SyncouchSubtitles';
import SyncouchVolume from './SyncouchVolume';

interface SynccouchControlsProps {
  isPlaying: boolean;
  currentTime: { current: number; total: number };
  buffer?: TimeRanges;
  subtitles?: Subtitle[];
  isFullScreen?: boolean;
  isVisible?: boolean;
  label?: string;
  volume?: number;
  onPlayPauseClick(): void;
  onSeek(seekTime: number): void;
  onFullScreenClick(): void;
  onSubtitleClick?(index: number): void;
  onVolumeChange?(number: number): void;
}

const SyncouchControls: React.FC<SynccouchControlsProps> = ({
  label,
  buffer,
  onSeek,
  volume,
  isPlaying,
  subtitles,
  isVisible,
  currentTime,
  isFullScreen,
  onVolumeChange,
  onSubtitleClick,
  onPlayPauseClick,
  onFullScreenClick,
}) => {
  return (
    <div className={clsx('controls', isVisible && 'is-visible')} data-state="hidden">
      <div className="controls-bar">
        <button id="playpause" type="button" data-state="play" onClick={onPlayPauseClick}>
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} fixedWidth />
        </button>
        <div className="progress">
          <SyncouchProgress
            label={label}
            current={currentTime.current}
            duration={currentTime.total}
            buffer={buffer}
            onSeek={onSeek}
          />
        </div>

        <SyncouchVolume volume={volume} onVolumeChange={onVolumeChange} />

        <button
          className="SyncouchControls-subtitles"
          id="subtitles"
          type="button"
          data-state="subtitles"
        >
          <FontAwesomeIcon icon={faClosedCaptioning} fixedWidth />
          <SyncouchSubtitles subtitles={subtitles} onClick={onSubtitleClick} />
        </button>

        <button id="fs" type="button" data-state="go-fullscreen" onClick={onFullScreenClick}>
          <FontAwesomeIcon icon={isFullScreen ? faCompress : faExpand} fixedWidth />
        </button>
      </div>
    </div>
  );
};

export default SyncouchControls;
