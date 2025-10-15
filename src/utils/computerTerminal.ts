export const isSmartPhone = () => {
  if (navigator.userAgent.match(/iPhone|iPad|Android.+Mobile/)) {
    return true;
  } else {
    return false;
  }
}

export const isAndroid = () => {
  var ua = navigator.userAgent;
  if (ua.indexOf('Android') > 0){
    return true
  } else {
    return false
  }
}
