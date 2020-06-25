import EventEmitter from 'eventemitter3';

export type TextTrackWithId = TextTrack & { id?: string };

interface CueEvents {
  [key: string]: () => void;
}

export class SyncouchSubtitleAPI extends EventEmitter {
  private track: TextTrackWithId;
  private cueEvents: CueEvents = {};

  constructor(track: TextTrackWithId) {
    super();

    this.track = track;

    this.init();
  }

  onCueEnter(cue: TextTrackCue) {
    return () => {
      const { text } = cue as VTTCue;

      this.emit('subtitle-enter', text);
    };
  }

  onCueExit() {
    return () => {
      this.emit('subtitle-exit');
    };
  }

  init() {
    const { track } = this;

    if (!track.cues) {
      return;
    }

    for (let i = 0; i < track.cues.length; i += 1) {
      const cue = track.cues?.[i] as VTTCue;

      if (cue) {
        this.cueEvents[`${cue.startTime}-enter`] = () => {
          const { text } = cue;
          this.emit('subtitle-enter', text);
        };

        this.cueEvents[`${cue.startTime}-exit`] = () => {
          this.emit('subtitle-exit');
        };

        cue.addEventListener('enter', this.cueEvents[`${cue.startTime}-enter`]);
        cue.addEventListener('exit', this.cueEvents[`${cue.startTime}-exit`]);
      }
    }
  }

  removeCueListeners() {
    const { track } = this;
    if (!track.cues) return;

    this.emit('subtitle-exit');

    for (let i = 0; i < track.cues.length; i += 1) {
      const cue = track.cues?.[i] as VTTCue;

      cue.removeEventListener('enter', this.cueEvents[`${cue.startTime}-enter`]);
      cue.removeEventListener('exit', this.cueEvents[`${cue.startTime}-exit`]);
    }
  }
}
