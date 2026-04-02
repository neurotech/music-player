import { useEffect } from "react";

export function useMouseBackForward(onBack: () => void, onForward: () => void) {
  useEffect(() => {
    function handleMouseButton(event: MouseEvent) {
      if (event.button === 3) {
        event.preventDefault();
        onBack();
      } else if (event.button === 4) {
        event.preventDefault();
        onForward();
      }
    }

    window.addEventListener("mouseup", handleMouseButton);
    return () => {
      window.removeEventListener("mouseup", handleMouseButton);
    };
  }, [onBack, onForward]);
}
