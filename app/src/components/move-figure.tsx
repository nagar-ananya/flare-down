import React, { useEffect, useState } from 'react';

import { BODY_MOVES, type MoveArt, type PortraitArt } from '../constants/moves';
import { BodyFigure } from './move-body';
import { PORTRAIT_POSES, Portrait } from './move-portrait';

function useSeconds(): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const start = Date.now();
    let frame = requestAnimationFrame(function tick() {
      setSeconds((Date.now() - start) / 1000);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return seconds;
}

function isPortrait(art: MoveArt): art is PortraitArt {
  return art in PORTRAIT_POSES;
}

export function MoveFigure({ art, height = 220 }: { art: MoveArt; height?: number }): React.ReactElement {
  const seconds = useSeconds();
  if (isPortrait(art)) {
    return <Portrait art={art} seconds={seconds} height={height} />;
  }
  return <BodyFigure move={BODY_MOVES[art]} seconds={seconds} height={height} />;
}
