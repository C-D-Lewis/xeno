import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * TextButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - Button label.
 * @returns {FabricateComponent} TextButton component.
 */
const TextButton = ({ label }: { label: string }) => fabricate('Text')
  .setStyles(({ palette }) => ({
    fontSize: '1rem',
    color: palette.text,
    cursor: 'pointer',
    flex: '1',
    margin: '5px',
    padding: '8px 10px',
    borderRadius: '5px',
    textAlign: 'center',
    backgroundColor: palette.widgetPanel,
  }))
  .setText(label);

export default TextButton;
