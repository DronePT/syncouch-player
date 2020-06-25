import React, { useState, useMemo, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeDown, faVolumeMute } from '@fortawesome/free-solid-svg-icons';

import './SyncouchVolume.scss';

interface SyncouchVolumeProps {
  volume?: number;
  onVolumeChange?(volume: number): void;
}

const SyncouchVolume: React.FC<SyncouchVolumeProps> = ({ volume, onVolumeChange }) => {
  const volumeRef = useRef<HTMLDivElement | null>(null);
  const [tmpVolume, setTmpVolume] = useState(volume);

  const mouseMoveHandler = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { current: target } = volumeRef;

      if (!target) return;

      const { left, width } = target.getBoundingClientRect();

      const newVolume = Math.min(
        100,
        Math.max(0, Math.ceil(((event.clientX - left) / width) * 100))
      );

      setTmpVolume(newVolume);
    },
    [volumeRef]
  );

  const vol = useMemo(() => tmpVolume || volume || 0, [tmpVolume, volume]);

  return (
    <button type="button" className="SyncouchVolume">
      <FontAwesomeIcon icon={vol && vol > 0 ? faVolumeDown : faVolumeMute} fixedWidth />
      <span className="volume">{vol}%</span>

      <div className="SyncouchVolume-control">
        <div
          className="SyncouchVolume-control-container"
          ref={volumeRef}
          onMouseMove={mouseMoveHandler}
          onClick={() => {
            if (onVolumeChange) onVolumeChange(vol);
          }}
          onMouseLeave={() => setTmpVolume(0)}
        >
          <div className="SyncouchVolume-control-slider" style={{ width: `${vol}%` }}></div>
        </div>
      </div>
    </button>
  );
};

export default SyncouchVolume;
