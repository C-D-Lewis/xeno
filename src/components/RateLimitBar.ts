import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../theme';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/** Bar height */
const RATE_LIMIT_BAR_HEIGHT = 3;

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
    padding: '0px 4px 0px 0px',
  })
  .onUpdate((el, { rateLimitInfo }) => {
    const { used, remaining } = rateLimitInfo;
    const widthPerc = (used / (used + remaining)) * 100;

    el.setStyles({ width: `${100 - widthPerc}%` });
  }, [fabricate.StateKeys.Created]);

export default RateLimitBar;
