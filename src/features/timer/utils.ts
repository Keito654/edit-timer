export const calcElapse = (
  now: number,
  accumulated: number,
  startAt: number,
) => {
  return accumulated + (now - startAt);
};
