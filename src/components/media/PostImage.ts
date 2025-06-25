/* eslint-disable no-nested-ternary */
import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState, GalleryImageItem } from '../../types.ts';
import ImageListControls from './ImageListControls.ts';
import AppLoader from '../AppLoader.ts';
import { buildIntersectionObserver } from '../../utils.ts';

declare const fabricate: Fabricate<AppState>;

const imgObserver = buildIntersectionObserver();

/**
 * ImageLoader component to show a loading indicator while the image is loading.
 *
 * @returns {FabricateComponent} ImageLoader component.
 */
const ImageLoader = () => fabricate('Row')
  .setStyles({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    left: '0',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  })
  .setChildren([
    AppLoader(),
  ]);

/**
 * Image component for gallery posts.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post ID.
 * @param {string} props.imageSource - Image source URL.
 * @param {GalleryImageItem[]} props.imageList - List of images in the gallery.
 * @param {boolean} props.isGif - Whether the post is a GIF.
 * @param {boolean} props.nsfw - Whether the post is marked as NSFW.
 * @returns {FabricateComponent} GalleryImage component.
 */
const PostImage = ({
  id,
  imageSource,
  imageList,
  isGif,
  nsfw,
}: {
  id: string;
  imageSource: string;
  imageList: GalleryImageItem[];
  isGif: boolean;
  nsfw: boolean;
}) => {
  const indexKey = fabricate.buildKey('imageListIndex', id);
  const loadedKey = fabricate.buildKey('imageLoaded', id);
  // Cause of slowdown?
  // fabricate.update(loadedKey, false);

  /**
   * When the image is loaded, set the opacity to 1.
   *
   * @param {Event} e - Event.
   * @returns {void}
   */
  const onImageLoad = (e: Event) => {
    const el = e.target as FabricateComponent<AppState>;
    el.setStyles({
      opacity: '1',
      minHeight: '',
    });
    fabricate.update(loadedKey, true);
  };

  const imageEl = fabricate('img')
    .setStyles({
      cursor: 'pointer',
      width: '100%',
      minHeight: '240px',
      height: 'auto',
      objectFit: 'contain',
      maxHeight: fabricate.isNarrow() ? '90vh' : '75vh',
      margin: 'auto',
      opacity: '0',
      borderBottomLeftRadius: '5px',
      borderBottomRightRadius: '5px',
      transition: '0.3s',
    })
    .onClick(() => window.open(imageSource, '_blank'))
    .onUpdate((el, state) => {
      if (!imageList.length) return;

      el.setStyles({ opacity: '0.3' });
      el.setAttributes({ src: imageList[state[indexKey]].url });
    }, [indexKey])
    .onCreate((el) => {
      el.dataset.src = imageList.length > 1 ? imageList[0].url : imageSource;

      imgObserver.observe(el);
      el.addEventListener('load', onImageLoad);
    })
    .onDestroy((el) => {
      imgObserver.unobserve(el);
      el.removeEventListener('load', onImageLoad);
    });

  return fabricate('Column')
    .setStyles({ position: 'relative' })
    .displayWhen((state) => !(isGif || nsfw) || state.visibleMediaPostId === id)
    .setChildren([
      imageEl,
      ImageLoader()
        .displayWhen((state) => !state[loadedKey]),
      ImageListControls({ id, imageList }),
    ]);
};

export default PostImage;
