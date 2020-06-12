import React from 'react';

export interface Subtitle {
  label: string;
  lang: string;
  src: string;
  default?: boolean;
  active?: boolean;
}

interface SyncouchSubtitlesProps {
  subtitles?: Subtitle[];
  onClick?(index: number): void;
}

const SyncouchSubtitles: React.FC<SyncouchSubtitlesProps> = ({ subtitles, onClick }) => {
  return (
    <ul>
      {subtitles &&
        subtitles
          .sort((a, b) => {
            if (a.label > b.label) return 1;
            if (a.label < b.label) return -1;

            return 0;
          })
          .map((subtitle, index) => (
            <li key={`subtitle_${index}`} className={``}>
              <a
                href={`#${subtitle.src}`}
                onClick={(event) => {
                  event.preventDefault();

                  if (onClick) {
                    onClick(index);
                  }
                }}
              >
                {subtitle.label}
              </a>
            </li>
          ))}
    </ul>
  );
};

export default SyncouchSubtitles;
