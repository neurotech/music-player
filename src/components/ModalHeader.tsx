import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/Button";

import { panelHeaderClass } from "./panel-styles";

interface ModalHeaderProps {
  title: string;
  titleId: string;
  onClose: () => void;
  closeLabel: string;
  /** Extra actions before the close control. */
  actions?: ReactNode;
}

export function ModalHeader({
  title,
  titleId,
  onClose,
  closeLabel,
  actions,
}: ModalHeaderProps) {
  return (
    <div className={panelHeaderClass}>
      <h2 id={titleId} className="font-semibold text-sm text-zinc-100">
        {title}
      </h2>
      <div className="flex items-center gap-1">
        {actions}
        <Button
          variant="link"
          size="icon-sm"
          onClick={onClose}
          aria-label={closeLabel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
