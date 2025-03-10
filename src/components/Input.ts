import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * Input component.
 *
 * @param {object} props - Component props.
 * @param {string} props.placeholder - Placeholder text.
 * @returns {FabricateComponent} Input component.
 */
const Input = ({ placeholder }: { placeholder: string }) => fabricate('TextInput', {
  placeholder,
  backgroundColor: '#111',
  color: 'white',
})
  .setStyles({ padding: '6px', border: 'none' });

export default Input;
