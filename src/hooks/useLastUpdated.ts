import { useEffect, useState } from "react";

export function useLastUpdated(isRefetching: boolean) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [displayTime, setDisplayTime] = useState<string>("");

  useEffect(() => {
    if (!isRefetching) {
      setLastUpdated(new Date());
    }
  }, [isRefetching]);

  useEffect(() => {
    const updateDisplayTime = () => {
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

      if (diffSeconds < 60) {
        setDisplayTime("just now");
      } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        setDisplayTime(`${minutes}m ago`);
      } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        setDisplayTime(`${hours}h ago`);
      } else {
        setDisplayTime(
          lastUpdated.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    };

    updateDisplayTime();
    const interval = setInterval(updateDisplayTime, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return { lastUpdated, displayTime };
}
