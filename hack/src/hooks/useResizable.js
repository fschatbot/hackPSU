import { useState, useCallback, useEffect } from 'react';

export function useResizable(initialWidth, minWidth, maxWidthPercent) {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(`panel_width_${initialWidth}`);
    return saved ? parseInt(saved, 10) : initialWidth;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    localStorage.setItem(`panel_width_${initialWidth}`, width.toString());
  }, [width, initialWidth]);

  const startResize = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (deltaX) => {
      setWidth((prevWidth) => {
        const newWidth = prevWidth + deltaX;
        const maxWidth = (window.innerWidth * maxWidthPercent) / 100;
        return Math.max(minWidth, Math.min(newWidth, maxWidth));
      });
    },
    [minWidth, maxWidthPercent]
  );

  return {
    width,
    isResizing,
    startResize,
    stopResize,
    resize,
  };
}
