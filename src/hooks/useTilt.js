import { useCallback, useRef } from 'react';

export default function useTilt({ max = 8, scale = 1.02, perspective = 900 } = {}) {
  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * max;
    const ry = (px - 0.5) * max;
    el.style.transform = `perspective(${perspective}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px) scale(${scale})`;
  }, [max, scale, perspective]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
  }, []);

  return {
    ref,
    onMouseMove,
    onMouseLeave,
    style: {
      transformStyle: 'preserve-3d',
      willChange: 'transform',
      transition: 'transform 0.18s ease-out',
    },
  };
}