import EventEmitter from 'eventemitter3';
import { isNumber, isNaN, round } from 'lodash';
import { SyncouchSubtitleAPI, TextTrackWithId } from './SyncouchSubtitleAPI';

export interface VideoDimensions {
  width: number;
  height: number;
}

export class SyncouchAPI extends EventEmitter {
  private video: HTMLVideoElement;
  private isPlaying: boolean;
  private track: SyncouchSubtitleAPI;
  private isReadyToPlay: boolean = false;

  constructor(video: HTMLVideoElement) {
    super();

    this.video = video;
    this.isPlaying = false;

    this.init();
  }

  private init() {
    const { video } = this;

    const handleEvent = (event: Event) => {
      this.emit(event.type, event);
    };

    video.addEventListener('loadstart', handleEvent);
    video.addEventListener('loadeddata', handleEvent);
    video.addEventListener('abort', handleEvent);
    video.addEventListener('error', handleEvent);
    video.addEventListener('canplaythrough', handleEvent);

    video.addEventListener('canplay', (event) => {
      this.computeIsReadyToPlay();
      handleEvent(event);
    });
    video.addEventListener('waiting', (event) => {
      this.computeIsReadyToPlay();
      handleEvent(event);
    });

    video.addEventListener('progress', () => {
      this.computeIsReadyToPlay();

      this.emit('video-buffer', this.video.buffered);
    });

    video.addEventListener('volumechange', () => {
      this.emit('video-volume', this.getVolume());
    });

    video.addEventListener('loadedmetadata', () => {
      this.setupSubtitles();

      this.emit('video-dimensions', this.getDimensions());

      this.emit('video-duration', {
        current: this.getCurrentTime(),
        total: this.video.duration,
      });
    });

    video.addEventListener('play', () => {
      this.emit('video-play');
      this.isPlaying = true;
    });

    video.addEventListener('playing', () => {
      this.emit('video-playing');
      this.isPlaying = true;
    });

    video.addEventListener('pause', () => {
      this.emit('video-pause');
      this.isPlaying = false;
    });

    video.addEventListener('timeupdate', () => {
      this.computeIsReadyToPlay();

      this.emit('video-time', {
        current: video.currentTime,
        total: video.duration,
      });
    });
  }

  private computeIsReadyToPlay() {
    const { video } = this;

    const isReadyToPlay = video.readyState > 3;

    if (isReadyToPlay && !this.isReadyToPlay) {
      this.emit('video-ready');
    }

    if (!isReadyToPlay && this.isReadyToPlay) {
      this.emit('video-loading');
    }

    this.isReadyToPlay = isReadyToPlay;
  }

  getDimensions(): VideoDimensions {
    const { videoWidth: width, videoHeight: height } = this.video;

    return {
      width,
      height,
    };
  }

  private setupSubtitles() {
    const { textTracks } = this.video;

    // hide native subtitles display
    for (let i = 0; i < textTracks.length; i += 1) {
      textTracks[i].mode = 'hidden';
    }
  }

  setSubtitle(currentTrackId: number) {
    // If there is already a track enabled, we need to remove all listeenrs
    if (this.track) {
      this.track.removeCueListeners();
    }

    const { textTracks } = this.video;

    const track: TextTrackWithId = textTracks[currentTrackId];

    this.track = new SyncouchSubtitleAPI(track);

    this.track.addListener('subtitle-enter', (text) => this.emit('subtitle-enter', text));
    this.track.addListener('subtitle-exit', () => this.emit('subtitle-exit'));
  }

  seekTo(time: number) {
    const { video } = this;

    this.setCurrentTime(time);

    this.emit('video-seek', {
      current: video.currentTime,
      total: video.duration,
    });
  }

  play() {
    this.video.play();
  }

  pause() {
    this.video.pause();
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
      return;
    }

    this.play();
  }

  mute() {
    this.video.muted = true;
  }

  unmute() {
    this.video.muted = false;
  }

  toggleMute() {
    if (this.isMuted()) {
      this.unmute();
      return;
    }

    this.mute();
  }

  isMuted() {
    return this.video.muted;
  }

  changeVolume(volume: number) {
    const v = Math.max(0, Math.min(100, volume));

    this.video.volume = round(v / 100, 2);
  }

  getVolume(): number {
    if (this.isMuted()) return 0;

    return round(this.video.volume * 100, 0);
  }

  getCurrentTime() {
    return this.video.currentTime;
  }

  getDuration() {
    return this.video.duration || 0;
  }

  setCurrentTime(time: number) {
    if (!isNumber(time) || isNaN(time)) return;

    this.video.currentTime = time;
  }
}
