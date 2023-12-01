export const isSmartPhone = () => {
  if (navigator.userAgent.match(/iPhone|iPad|Android.+Mobile/)) {
    return true;
  } else {
    return false;
  }
}