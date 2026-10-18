import { BODY_MOVES } from '../../constants/moves';
import { poseAt } from '../move-body';

const move = BODY_MOVES['toe-reach'];
const cycle = move.frames.reduce((sum, [, duration]) => sum + duration, 0);

describe('poseAt', () => {
  it('lands on each keyframe at the end of its segment', () => {
    let t = 0;
    for (const [pose, duration] of move.frames) {
      t += duration;
      expect(poseAt(move, t - 1e-9).torso).toBeCloseTo(pose.torso);
    }
  });

  it('loops once the cycle is over', () => {
    expect(poseAt(move, cycle + 1.2).torso).toBeCloseTo(poseAt(move, 1.2).torso);
  });
});
