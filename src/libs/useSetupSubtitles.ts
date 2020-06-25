import { useEffect } from 'react';

import { Subtitle } from '../components/SyncouchSubtitles';
import { SyncouchAPI } from './SyncouchAPI';

export const useSetupSubtitles = (
  subtitles: Subtitle[] | undefined,
  videoEl: HTMLVideoElement | null,
  videoAPI: SyncouchAPI | null
) => {
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
};
