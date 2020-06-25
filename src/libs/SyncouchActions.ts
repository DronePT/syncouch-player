import { useCallback } from 'react';
import { SyncouchAPI } from './SyncouchAPI';

export const useSyncouchVideoActions = (
  videoAPI: SyncouchAPI | null,
  videoPlayerElement: HTMLDivElement | null
) => {
  const playPauseHandler = useCallback(() => {
    if (!videoAPI) return;
    videoAPI.toggle();
  }, [videoAPI]);

  const videoSeekHandler = useCallback(
    (seekTime: number) => {
      if (!videoAPI) return;
      videoAPI.seekTo(seekTime);
    },
    [videoAPI]
  );

  const fullScreenClickHandler = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    if (videoPlayerElement) {
      videoPlayerElement.requestFullscreen().catch((err) => console.warn(err));
    }
  }, [videoAPI, videoPlayerElement]);

  const subtitleClickHandler = useCallback(
    (index: number) => {
      if (!videoAPI) return;

      videoAPI.setSubtitle(index);
    },
    [videoAPI]
  );

  const volumeChangeHandler = useCallback(
    (volume: number) => {
      if (!videoAPI) return;

      videoAPI.changeVolume(volume);
    },
    [videoAPI]
  );

  return {
    playPauseHandler,
    videoSeekHandler,
    volumeChangeHandler,
    subtitleClickHandler,
    fullScreenClickHandler,
  };
};
