import { useEffect, useState } from 'preact/hooks';

let push: ((msg: string) => void) | null = null;

/** 在任何地方弹一句提示 */
export function toast(msg: string) {
  push?.(msg);
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer = 0;
    push = (m) => {
      setMsg(m);
      clearTimeout(timer);
      timer = window.setTimeout(() => setMsg(null), 2400);
    };
    return () => {
      push = null;
      clearTimeout(timer);
    };
  }, []);
  return (
    <div class="toast-host" role="status" aria-live="polite">
      {msg && <div class="toast">{msg}</div>}
    </div>
  );
}
