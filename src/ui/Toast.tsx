import { useEffect } from "react";

type Props = {
  message: string | null;
  onDone: () => void;
};

export function Toast({ message, onDone }: Props) {
  useEffect(() => {
    if (!message) {
      return;
    }
    const timeout = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(timeout);
  }, [message, onDone]);

  return <div className={message ? "toast visible" : "toast"}>{message}</div>;
}
