import { useCallback } from 'react';
import { SCREEN } from '../../config/scene';
import { useEntryDevice } from '../../hooks/useEntryDevice';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useLookStops } from '../../lib/touchLook';
import { useExperience } from '../../store/experience';
import { labelElements, useSceneHover, type HoverTarget } from '../../store/sceneHover';
import styles from './SceneLabels.module.css';

/**
 * Tags that float above the monitor, the phone and the whiteboard, each
 * positioned by its 3D interaction (scene/*Interaction.tsx). Pointers get them
 * on hover; touch screens can't hover, so there the way in and the board keep
 * theirs up as a "tap here" cue while the view is on them.
 */
export function SceneLabels() {
  const hovered = useSceneHover((s) => s.hovered);
  const exploring = useExperience((s) => s.phase === 'exploring');
  const touch = useMediaQuery('(pointer: coarse)');
  // Phones go in through the phone, everything else through the monitor (see useEntryDevice).
  const entry = useEntryDevice();
  // Slid over to something else, its cue is off to the side.
  const nearest = useLookStops((s) => s.nearest);
  const cue = (target: HoverTarget): boolean => hovered === target || (touch && nearest === target);

  return (
    <>
      <Label
        target="monitor"
        // Only the way in gets the monitor's tag; on phones a tap there asks first (ui/DevicePrompt.tsx).
        visible={exploring && entry === 'monitor' && cue('monitor')}
        touch={touch}
        text={touch ? SCREEN.tapLabel : SCREEN.hoverLabel}
      />
      <Label
        target="phone"
        visible={exploring && (entry === 'phone' ? cue('phone') : hovered === 'phone')}
        touch={touch && entry === 'phone'}
        text={entry === 'phone' ? SCREEN.phoneTapLabel : SCREEN.phoneHoverLabel}
      />
      <Label
        target="board"
        visible={exploring && cue('board')}
        touch={touch}
        text={touch ? SCREEN.boardTapLabel : SCREEN.boardHoverLabel}
      />
    </>
  );
}

interface LabelProps {
  target: HoverTarget;
  visible: boolean;
  /** Styled as an always-on "tap here" cue. */
  touch: boolean;
  text: string;
}

function Label({ target, visible, touch, text }: LabelProps) {
  const register = useCallback(
    (element: HTMLDivElement | null) => {
      labelElements[target].current = element;
    },
    [target],
  );

  return (
    <div ref={register} className={styles.anchor} aria-hidden="true">
      <span className={styles.label} data-visible={visible} data-touch={touch}>
        {text}
      </span>
    </div>
  );
}
