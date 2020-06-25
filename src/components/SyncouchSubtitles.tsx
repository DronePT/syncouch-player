import React, { useRef, useCallback } from 'react';

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
  onSubtitleFromPc?(files: FileList): void;
}

const SyncouchSubtitles: React.FC<SyncouchSubtitlesProps> = ({
  subtitles,
  onClick,
  onSubtitleFromPc,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleComputerSubtitleClick = useCallback(
    (_event: React.MouseEvent) => {
      // event.preventDefault();
      if (!fileRef.current) return;
      fileRef.current.click();
    },
    [fileRef]
  );

  return (
    <ul>
      <li>
        <div
          role="button"
          className="SyncouchSubtitlesFromPc"
          onClick={handleComputerSubtitleClick}
        >
          <input
            ref={fileRef}
            multiple
            type="file"
            name="computer-subtitle"
            accept=".srt,.vtt"
            onChange={(event) => {
              if (onSubtitleFromPc && event.target.files) {
                onSubtitleFromPc(event.target.files);
              }
            }}
          />
          Select from computer
        </div>
      </li>
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
