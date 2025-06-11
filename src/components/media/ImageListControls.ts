import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState, GalleryImageItem } from '../../types.ts';
import ImageButton from '../ImageButton.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * ImageListControls component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post ID.
 * @param {GalleryImageItem[]} props.imageList - Image URL list.
 * @returns {FabricateComponent} ImageListControls component.
 */
const ImageListControls = ({ id, imageList }: { id: string, imageList: GalleryImageItem[] }) => {
  const numImages = imageList.length;
  if (numImages < 2) return fabricate('div');

  const indexKey = fabricate.buildKey('imageListIndex', id);
  fabricate.update(indexKey, 0);

  const arrowStyles = {
    margin: '0px',
    width: '100%',
    objectFit: 'contain',
    height: '32px',
  };

  const leftArrowImg = ImageButton({ src: 'assets/arrow-left.png' })
    .setStyles({
      ...arrowStyles,
      filter: 'brightness(0.5)',
    })
    .onUpdate((el, state) => {
      el.setStyles({ filter: `brightness(${state[indexKey] === 0 ? '0.5' : '1'})` });
    }, [indexKey])
    .onClick((el, state) => {
      if (state[indexKey] === 0) return;

      fabricate.update(indexKey, state[indexKey] - 1);
    });

  const currentIndexText = fabricate('Text')
    .setStyles(({ palette }) => ({
      padding: '8px 15px',
      fontSize: '1rem',
      color: palette.text,
      margin: '0px',
    }))
    .setText(`1/${numImages}`)
    .onUpdate(
      (el, state) => el.setText(`${state[indexKey] + 1}/${numImages}`),
      [indexKey],
    );

  const rightArrowImg = ImageButton({ src: 'assets/arrow-right.png' })
    .setStyles(arrowStyles)
    .onUpdate((el, state) => {
      el.setStyles({
        filter: `brightness(${state[indexKey] === numImages - 1 ? '0.5' : '1'})`,
      });
    }, [indexKey])
    .onClick((el, state) => {
      if (state[indexKey] === numImages - 1) return;

      fabricate.update(
        indexKey,
        Math.min(state[indexKey] + 1, numImages),
      );
    });

  return fabricate('Row')
    .setStyles({
      alignItems: 'center',
      margin: '0px auto',
      width: '100%',
    })
    .displayWhen(() => !!numImages)
    .setChildren([
      leftArrowImg,
      currentIndexText,
      rightArrowImg,
    ]);
};

export default ImageListControls;
