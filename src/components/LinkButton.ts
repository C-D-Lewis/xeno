import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';

declare const fabricate: Fabricate<AppState>;
declare const fab: Fabricate<AppState>;

/**
 * LinkButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.href - Link href.
 * @returns {FabricateComponent} LinkButton component.
 */
const LinkButton = ({ href }: { href?: string }) => (href
  ? fab('a', {
    margin: '8px',
    alignItems: 'center',
  }, [
    fabricate('Image', { src: 'assets/link.png' })
      .setStyles({
        width: '24px',
        height: '24px',
        filter: 'brightness(0.7)',
      })
      .onHover((el, state, isHovered) => el.setStyles({ filter: `brightness(${isHovered ? '1' : '0.7'})` })),
  ])
    .asFlex('row')
    .setAttributes({ href, target: '_blank' })
  : fab('div'));

export default LinkButton;
