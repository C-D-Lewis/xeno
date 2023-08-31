import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../theme';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/**
 * ScrollTopButton component.
 *
 * @param {object} props - Component props.
 * @param {FabricateComponent} props.root - Root element to scroll.
 * @returns {FabricateComponent} ScrollTopButton component.
 */
const ScrollTopButton = ({ root }: { root: FabricateComponent<AppState> }) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
      left: fabricate.isNarrow() ? '33%' : '45%',
      borderRadius: '5px',
      width: '120px',
      zIndex: '9999',
      padding: '8px',
      cursor: 'pointer',
    })
    .setText('Back to top')
    .onClick(() => root.scrollTo(0, 0));

  // Can't use onEvent here
  root.addEventListener('scroll', () => {
    if (scrollHandle) clearTimeout(scrollHandle);
    div.setStyles({ top: root.scrollTop === 0 ? '-100px' : '25px' });

    // TODO: Only in up direction?

    scrollHandle = setTimeout(() => {
      scrollHandle = null;
      div.setStyles({ top: '-100px' });
    }, 3000);
  });

  return div;
};

export default ScrollTopButton;
