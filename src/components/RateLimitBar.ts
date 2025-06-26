import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../theme.ts';
import { AppState } from '../types.ts';

declare const fab: Fabricate<AppState>;

/** Bar height */
const BAR_HEIGHT = 3;

/**
 * RateLimitBar component.
 *
 * @returns {FabricateComponent} RateLimitBar component.
 */
const RateLimitBar = () => fab('div', {
  height: `${BAR_HEIGHT}px`,
  backgroundColor: Theme.palette.primary,
  width: '0px',
  transition: '0.3s',
  padding: '0px 4px 0px 0px',
})
  .onCreate((el, { rateLimitInfo }) => {
    const { used, remaining } = rateLimitInfo;
    const widthPerc = (used / (used + remaining)) * 100;

    el.setStyles({ width: `${100 - widthPerc}%` });
  });

export default RateLimitBar;
