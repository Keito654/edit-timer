export const convertToHMS = (milliseconds: number) => {
  const dateObj = new Date(milliseconds);
  const hours = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();
  const seconds = dateObj.getUTCSeconds();

  return {
    hours,
    minutes,
    seconds,
  };
};

export const formatTime = (ms: number | null): string => {
  if (ms === null) {
    return '--:--:--';
  }
  const { hours, minutes, seconds } = convertToHMS(ms);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
