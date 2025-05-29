import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../../types.ts';
import { decodeHtml } from '../../utils.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * BodyText component.
 *
 * @param {object} props - Component props.
 * @param {string} props.text - Post self text HTML.
 * @returns {FabricateComponent} BodyText component.
 */
const BodyText = ({ text }: { text: string }) => fabricate('Text')
  .setStyles(({ palette }) => ({
    fontSize: '0.9rem',
    color: palette.text,
    padding: '8px',
    borderRadius: '5px',
    backgroundColor: palette.widgetBackground,
  }))
  .setHtml(decodeHtml(text) || 'Failed to load text post');

export default BodyText;
