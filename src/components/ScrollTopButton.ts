import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import { APP_NAV_BAR_HEIGHT } from './AppNavBar.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * ScrollTopButton component.
 *
 * @returns {FabricateComponent} ScrollTopButton component.
 */
const ScrollTopButton = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let scrollHandle: any;
  let lastScrollY = window.scrollY;

  const root = fabricate('Row')
    .setStyles(({ palette }) => ({
      justifyContent: 'center',
      textAlign: 'center',
      alignItems: 'center',
      backgroundColor: palette.primary,
      transition: '0.5s',
      position: 'fixed',
      top: '-100px',
      left: fabricate.isNarrow() ? '33%' : '45%',
      borderRadius: '5px',
      minWidth: '120px',
      zIndex: '9999',
      padding: '4px 8px',
      cursor: 'pointer',
    }))
    .setChildren([
      fabricate('Image', { src: 'assets/arrow-up.png' })
        .setStyles({ width: '24px', height: '24px' }),
      fabricate('Text')
        .setStyles(({ palette }) => ({ color: palette.text }))
        .setText('Back to top'),
    ])
    .onClick(() => window.scrollTo(0, 0));

  // Can't use onEvent here
  window.addEventListener('scroll', () => {
    const { scrollY: scrollYNow } = window;
    const isScrollingUp = scrollYNow < lastScrollY;
    lastScrollY = scrollYNow;
    if (!isScrollingUp) return;

    root.setStyles({ top: scrollYNow === 0 ? '-100px' : `${APP_NAV_BAR_HEIGHT / 2}px` });

    clearTimeout(scrollHandle);
    scrollHandle = setTimeout(() => {
      root.setStyles({ top: '-100px' });
    }, 1500);
  });

  return root;
};

export default ScrollTopButton;
