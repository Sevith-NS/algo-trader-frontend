'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';

export function SheetDemo() {
  const [open, setOpen] = useState<'short' | 'long' | null>(null);
  const close = () => setOpen(null);

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => setOpen('short')}>Open sheet</Button>
      <Button variant="secondary" onClick={() => setOpen('long')}>Open long sheet with footer</Button>

      <Sheet open={open === 'short'} onClose={close} title="Filters" description="Narrow the list. Changes apply when you close.">
        <p className="text-body-sm text-fg-2">Short content. Escape, the scrim, the close button and (on phone) dragging the handle down all close it.</p>
      </Sheet>

      <Sheet
        open={open === 'long'}
        onClose={close}
        title="New paper order"
        description="Books into your paper portfolio only."
        footer={<Button variant="paper" className="w-full" onClick={close}>Place paper order</Button>}
      >
        <div className="flex flex-col gap-3">
          {Array.from({ length: 24 }, (_, i) => (
            <p key={i} className="text-body-sm text-fg-2">Row {i + 1}: the body scrolls; the header and footer stay put.</p>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
