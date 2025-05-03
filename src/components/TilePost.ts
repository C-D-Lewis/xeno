/* eslint-disable no-nested-ternary */
import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState, Post } from '../types.ts';
import PostHeader from './PostHeader.ts';

declare const fabricate: Fabricate<AppState>;

// Lazy load images since some tags include a lot of posts
const imgObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.intersectionRatio <= 0) return;

    const img = entry.target as HTMLImageElement;
    img.src = img.dataset.src!;
    imgObserver.unobserve(img);
  });
}, { root: null, rootMargin: '100px', threshold: 1 });

/**
 * TilePost component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const TilePost = ({ post }: { post: Post }) => {
  const {
    iframe, imageSource, videoSourceData, imageList,
  } = post;

  const hasVideo = !!videoSourceData;
  const hasIframeEmbed = !!iframe;
  const hasImage = !hasVideo && !hasIframeEmbed && imageSource;

  /**
   * When the image is loaded, set the opacity to 1.
   *
   * @param {Event} e - Event.
   * @returns {void}
   */
  const onImageLoad = (e: Event) => {
    const el = e.target as FabricateComponent<AppState>;
    const img = e.target as HTMLImageElement;
    const partialPortraitWidth = fabricate.isNarrow() ? '49%' : '24%';
    const partialLandscapeWidth = fabricate.isNarrow() ? '100%' : '49%';
    el.setStyles({
      opacity: '1',
      width: img.naturalWidth > img.naturalHeight ? partialLandscapeWidth : partialPortraitWidth,
    });
  };

  const imageEl = hasImage
    ? fabricate('img')
      .setStyles({
        cursor: 'pointer',
        width: '49%',
        height: 'auto',
        objectFit: 'contain',
        maxHeight: fabricate.isNarrow() ? '100vh' : '75vh',
        margin: '2px',
        opacity: '0.2',
        transition: '0.3s',
        borderRadius: '5px',
        overflow: 'hidden',
      })
      .onClick(() => window.open(imageSource, '_blank'))
      .onCreate((el) => {
        el.dataset.src = imageList.length > 1 ? imageList[0].url : imageSource;

        imgObserver.observe(el);
        el.addEventListener('load', onImageLoad);
      })
      .onDestroy((el) => {
        // Don't leak observer references
        imgObserver.unobserve(el);
        el.removeEventListener('load', onImageLoad);
      })
    : undefined;

  // Show the image or just the post info
  return hasImage
    ? imageEl!
    : PostHeader({ post })
      .setStyles({
        width: fabricate.isNarrow() ? '100%' : '24%',
        height: 'auto',
        margin: '2px',
        borderRadius: '5px',
        overflow: 'hidden',
      });
};

export default TilePost;
