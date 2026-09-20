import { useCallback, useRef } from 'react';

export default function useMagnetic({ strength = 0.28 } = {}) {
  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${(x * strength).toFixed(1)}px, ${(y * strength).toFixed(1)}px)`;
  }, [strength]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
  }, []);

  return {
    ref,
    onMouseMove,
    onMouseLeave,
    style: { transition: 'transform 0.3s cubic-bezier(0.22, 0.8, 0.3, 1)' },
  };
}