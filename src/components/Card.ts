import { Fabricate } from 'fabricate.js';
import Theme from '../theme';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/**
 * Card component.
 *
 * @returns {HTMLElement} Card component.
 */
const Card = () => fabricate('Fader')
  .asFlex('column')
  .setStyles({
    margin: '5px auto 10px auto',
    backgroundColor: Theme.palette.widgetBackground,
    borderRadius: '5px',
    overflow: 'hidden',
    height: 'fit-content',
  });

export default Card;
