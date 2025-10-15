export const run = (scipt: string) => {
  const scriptAlert = document.createElement('script');
  scriptAlert.type = 'text/javascript';

  const textAlert = document.createTextNode(scipt);
  scriptAlert.appendChild(textAlert);

  const head = document.getElementsByTagName('head')[0] as HTMLElement;
  head.appendChild(scriptAlert);
  head.removeChild(scriptAlert);
}