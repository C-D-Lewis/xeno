import { Fabricate, FabricateComponent } from 'fabricate.js/types/fabricate';
import Theme from '../theme';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/** Bar height */
export const RATE_LIMIT_BAR_HEIGHT = 3;

const commonStyles = {
  height: `${RATE_LIMIT_BAR_HEIGHT}px`,
  width: '0px',
  transition: '0.3s',
  zIndex: '999',
};

/**
 * RateLimitBar component.
 *
 * @returns {FabricateComponent} RateLimitBar component.
 */
const RateLimitBar = () => {
  const foreground = fabricate('div')
    .setStyles({
      ...commonStyles,
      backgroundColor: Theme.palette.primary,
    });
  const background = fabricate('div')
    .setStyles({
      ...commonStyles,
      backgroundColor: Theme.palette.widgetBackground,
    });

  return fabricate('Row')
    .setChildren([foreground, background])
    .onUpdate((el, { rateLimitInfo }) => {
      const { used, remaining } = rateLimitInfo;
      const widthPerc = (used / (used + remaining)) * 100;

      foreground.setStyles({ width: `${100 - widthPerc}%` });
      background.setStyles({ width: `${widthPerc}%` });
    }, ['rateLimitInfo']);
};

export default RateLimitBar;
