import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * LinkButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.href - Link href.
 * @returns {FabricateComponent} LinkButton component.
 */
const LinkButton = ({ href }: { href?: string }) => (href
  ? fabricate('a')
    .asFlex('row')
    .setStyles({ margin: '8px', alignItems: 'center' })
    .setAttributes({ href, target: '_blank' })
    .setChildren([
      fabricate('Image', { src: 'assets/link.png' })
        .setStyles({
          width: '24px',
          height: '24px',
          filter: 'brightness(0.7)',
        })
        .onHover((el, state, isHovered) => el.setStyles({ filter: `brightness(${isHovered ? '1' : '0.7'})` })),
    ])
  : fabricate('div'));

export default LinkButton;
