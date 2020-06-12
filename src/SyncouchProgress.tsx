import React, { useRef, useState, useCallback, useMemo } from 'react';
import formatDuration from 'format-duration';

import './SyncouchProgress.scss';

interface SyncouchProgressProps {
  current: number;
  duration: number;
  onSeek(seekTime: number): void;
  buffer?: TimeRanges;
  label?: string;
}

interface VideoBuffer {
  start: number;
  size: number;
}

const SyncouchProgress: React.FC<SyncouchProgressProps> = ({
  current,
  duration,
  onSeek,
  buffer,
  label,
}) => {
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [tempProgress, setTempProgress] = useState(0);

  const { current: progressEl } = progressRef;

  const onMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!progressEl) return;

      const { width, left } = progressEl.getBoundingClientRect();

      const mouseLeftPosition = event.clientX - left;
      const mouseLeftPositionPercent = (mouseLeftPosition / width) * 100;

      setTempProgress(mouseLeftPositionPercent);
    },
    [progressEl]
  );

  const buffers = useMemo(() => {
    if (!buffer || !progressEl) return [];

    const buffers: VideoBuffer[] = [];

    const numberOfBuffers = buffer.length;

    const { width } = progressEl.getBoundingClientRect();

    for (let i = 0; i < numberOfBuffers; i += 1) {
      const start = buffer.start(i);
      const size = ((buffer.end(i) - start) / duration) * width;

      buffers.push({
        start: (start / duration) * 100,
        size,
      });
    }

    return buffers;
  }, [buffer, duration, progressEl]);

  const onMouseLeave = () => {
    // onMouseMove.cancel();
    setTempProgress(0);
  };

  const onMouseClick = useCallback(() => {
    onSeek((tempProgress / 100) * duration);
  }, [duration, onSeek, tempProgress]);

  const currentStyle = {
    width: `${(current / duration) * 100}%`,
  };

  return (
    <div className="SyncouchProgress">
      {label && <div className="SyncouchProgress-label">{label}</div>}
      <div
        className="SyncouchProgress-progress"
        ref={progressRef}
        onMouseMove={(ev) => onMouseMove(ev)}
        onMouseLeave={onMouseLeave}
        onClick={onMouseClick}
      >
        <div className="SyncouchProgress-current" style={currentStyle}></div>
        <div className="SyncouchProgress-seek" style={{ width: `${tempProgress}%` }}>
          <span className="SyncouchProgress-seek--time">
            {tempProgress > 0 && formatDuration(duration * (tempProgress / 100) * 1000)}
          </span>
        </div>
        {buffers &&
          buffers.length > 0 &&
          buffers.map(
            (buffer, index) =>
              buffer.size > 3 && (
                <div
                  key={`buffer_${index}`}
                  className="SyncouchProgress-buffer"
                  style={{ left: `${buffer.start}%`, width: `${buffer.size}px` }}
                ></div>
              )
          )}
      </div>
      <div className="SyncouchProgress-duration">
        {formatDuration(current * 1000)} / {formatDuration(duration * 1000)}
      </div>
    </div>
  );
};

export default React.memo(SyncouchProgress);
