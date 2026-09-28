'use client';

/* A chip that is one value of a field — a tag, a selected option — arriving with
 * `list-in` when the value is added and leaving with `list-out` when it is
 * removed, inside a `ListPresence`. Shared by `TagsInput`, `TokenField` and
 * `MultiSelect`, whose chips are the same kind of thing.
 */
import type { ComponentProps } from 'react';
import { useListItemMotion } from '../../motion/ListPresence.js';
import { Chip } from './Chip.js';

export function PresentChip(props: ComponentProps<typeof Chip>): React.JSX.Element {
  const scope = useListItemMotion();
  return <Chip ref={scope as never} {...props} />;
}
