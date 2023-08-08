import { Fabricate, FabricateComponent } from 'fabricate.js/types/fabricate';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/**
 * ImageButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.src - Image source.
 * @returns {FabricateComponent} ImageButton component.
 */
const ImageButton = ({ src }: { src: string }) => fabricate('Image', { src })
  .setStyles({
    borderRadius: '5px',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    padding: '4px',
    marginLeft: '10px',
  })
  .onHover((el, state, isHovering) => {
    if (fabricate.isNarrow()) return;

    el.setStyles({ filter: `brightness(${isHovering ? '0.5' : '1'})` });
  });

export default ImageButton;
