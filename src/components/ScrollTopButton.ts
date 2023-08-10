import { Fabricate, FabricateComponent } from 'fabricate.js/types/fabricate';
import { AppState } from '../types';
import Theme from '../theme';

declare const fabricate: Fabricate<AppState>;

/**
 * ScrollTopButton component.
 *
 * @returns {FabricateComponent} ScrollTopButton component.
 */
const ScrollTopButton = () => {
  // @ts-ignore Timeout not importable
  let scrollHandle: Timeout;

  const div = fabricate('Column')
    .setStyles({
      justifyContent: 'center',
      textAlign: 'center',
      margin: '8px',
      alignItems: 'center',
      color: Theme.palette.text,
      backgroundColor: Theme.palette.primary,
      transition: '0.5s',
      position: 'fixed',
      top: '-100px',
      left: fabricate.isNarrow() ? '33%' : '50%',
      borderRadius: '5px',
      width: '120px',
      zIndex: '9999',
      padding: '8px',
      cursor: 'pointer',
    })
    .setText('Back to top')
    .onClick(() => window.scrollTo(0, 0));

  // Can't use onEvent here
  window.addEventListener('scroll', () => {
    if (scrollHandle) clearTimeout(scrollHandle);
    div.setStyles({ top: document.documentElement.scrollTop === 0 ? '-100px' : '15px' });

    scrollHandle = setTimeout(() => {
      scrollHandle = null;
      div.setStyles({ top: '-100px' });
    }, 3000);
  });

  return div;
};

export default ScrollTopButton;
