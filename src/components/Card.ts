import { Fabricate } from 'fabricate.js';
import { AppState } from '../types.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * Card component.
 *
 * @returns {HTMLElement} Card component.
 */
const Card = () => fabricate('Column')
  .setStyles(({ palette, styles }) => ({
    margin: '10px auto',
    backgroundColor: palette.widgetBackground,
    borderRadius: styles.borderRadius,
    overflow: 'hidden',
    height: 'fit-content',
  }));

export default Card;
