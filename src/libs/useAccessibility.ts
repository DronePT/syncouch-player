import { SyncouchAPI } from './SyncouchAPI';
import { useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { SyncouchActions } from './SyncouchActions';

interface useAccessibilityDependencies {
  syncouchVideoActions: SyncouchActions;
}

export const useAccessibility = (
  videoAPI: SyncouchAPI | null,
  { syncouchVideoActions }: useAccessibilityDependencies
) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(false);

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
      const { code, type, shiftKey, srcElement } = event;

      const srcElementName = (srcElement as HTMLElement)?.nodeName;

      if (!videoAPI || ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(srcElementName) > -1) return;

      showControls();

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
      hideControls.cancel();
      mouseMoveHandler.cancel();
      windowResizeHandler.cancel();

      window.removeEventListener('resize', windowResizeHandler);
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('keyup', keyUpDownHandler);
      document.removeEventListener('keydown', keyUpDownHandler);
      document.removeEventListener('fullscreenchange', fullScreenHandler);
    };
  }, [videoAPI]);

  return { isFullScreen, isControlsVisible };
};
