'use client';

import { useRef, useState } from 'react';
import { buttonClass, Button } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { Popover } from '@/components/ui/Popover';
import { Tooltip } from '@/components/ui/Tooltip';

export function OverlayDemo() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState('nothing yet');
  const anchor = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button ref={anchor} type="button" className={buttonClass('secondary')} aria-expanded={open} aria-controls="demo-popover"
              onClick={() => setOpen((o) => !o)}>
        Open popover
      </button>
      <Popover id="demo-popover" open={open} onClose={() => setOpen(false)} anchorRef={anchor} label="Demo popover" placement="bottom-start">
        <div className="flex flex-col gap-3 p-4">
          <p className="text-body-sm text-fg-2">Non-modal. Escape, a press outside or tabbing out closes it.</p>
          <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Done</Button>
        </div>
      </Popover>

      <Menu label="Actions" buttonClassName={buttonClass('secondary')} items={[
        { id: 'rename', label: 'Rename', onSelect: () => setPicked('Rename') },
        { id: 'dup', label: 'Duplicate', onSelect: () => setPicked('Duplicate') },
        { id: 'archive', label: 'Archive', disabled: true },
        { id: 'delete', label: 'Delete', tone: 'danger', onSelect: () => setPicked('Delete') },
      ]} />
      <span className="text-body-sm text-fg-2" aria-live="polite">Picked: {picked}</span>

      <Tooltip content="Time-weighted return ignores deposits and withdrawals">
        <button type="button" className={buttonClass('ghost')}>TWR</button>
      </Tooltip>
    </div>
  );
}
