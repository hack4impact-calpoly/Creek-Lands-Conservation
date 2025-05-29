import { useState, useEffect } from "react";

export default function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedCheck = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(checkMobile, 150);
    };

    window.addEventListener("resize", debouncedCheck);
    return () => {
      window.removeEventListener("resize", debouncedCheck);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return isMobile;
}
