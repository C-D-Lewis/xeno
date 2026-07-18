/* eslint-disable import/prefer-default-export */
import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * SkeletonPost component.
 *
 * @returns {FabricateComponent} SkeletonPost component.
 */
export const SkeletonPost = () => fabricate('Column')
  .setStyles(({ palette, styles }) => ({
    width: '99vw',
    height: '200px',
    borderRadius: styles.borderRadius,
    backgroundColor: palette.widgetBackground,
    margin: '8px auto',
  }));

// TODO: Vague sub-elements layout
