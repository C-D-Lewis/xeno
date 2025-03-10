import { Fabricate } from 'fabricate.js';
import { AppState } from '../types.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * Card component.
 *
 * @returns {HTMLElement} Card component.
 */
const Card = () => fabricate('Fader')
  .asFlex('column')
  .setStyles(({ palette }) => ({
    margin: '10px auto',
    backgroundColor: palette.widgetBackground,
    borderRadius: '5px',
    overflow: 'hidden',
    height: 'fit-content',
  }));

export default Card;
