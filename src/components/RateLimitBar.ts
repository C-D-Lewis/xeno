import { Fabricate, FabricateComponent } from 'fabricate.js/types/fabricate';
import Theme from '../theme';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/** Bar height */
export const RATE_LIMIT_BAR_HEIGHT = 3;

/**
 * RateLimitBar component.
 *
 * @returns {FabricateComponent} RateLimitBar component.
 */
const RateLimitBar = () => fabricate('div')
  .setStyles({
    height: `${RATE_LIMIT_BAR_HEIGHT}px`,
    backgroundColor: Theme.palette.primary,
    width: '0px',
    transition: '0.3s',
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    zIndex: '999',
  })
  .onUpdate((el, { rateLimitInfo }) => {
    const { used, remaining } = rateLimitInfo;
    const widthPerc = (used / (used + remaining)) * 100;

    el.setStyles({ width: `${100 - widthPerc}%` });
  }, ['rateLimitInfo']);

export default RateLimitBar;
