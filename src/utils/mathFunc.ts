export const map = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) => {
  let ratio = (toMax - toMin) / (fromMax - fromMin);
  return (value - fromMin) * ratio + toMin;
};