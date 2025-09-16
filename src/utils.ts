export const convertToHMS = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return {
    hours,
    minutes,
    seconds,
  };
};

export const formatTime = (ms: number | null): string => {
  if (ms === null) {
    return "--:--:--";
  }
  const { hours, minutes, seconds } = convertToHMS(ms);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
