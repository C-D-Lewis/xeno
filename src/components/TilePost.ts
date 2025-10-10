/* eslint-disable no-nested-ternary */
import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState, Post } from '../types.ts';
import Card from './Card.ts';
import PostTitle from './posts/PostTitle.ts';
import { buildIntersectionObserver, openPost } from '../utils.ts';

declare const fabricate: Fabricate<AppState>;
declare const fab: Fabricate<AppState>;

const imgObserver = buildIntersectionObserver();

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
   * For tile posts, change width to tile the images more effectively.
   *
   * @param {Event} e - Event.
   * @returns {void}
   */
  const onImageLoad = (e: Event) => {
    const el = e.target as FabricateComponent<AppState>;
    const img = e.target as HTMLImageElement;

    const portraitWidth = fabricate.isNarrow() ? '48%' : '24%';
    const landscapeWidth = fabricate.isNarrow() ? '100%' : '48%';

    el.setStyles({
      opacity: '1',
      width: img.naturalWidth > img.naturalHeight ? landscapeWidth : portraitWidth,
    });
  };

  const imageEl = hasImage
    ? fab('img', {
      cursor: 'pointer',
      width: '100%',
      height: 'auto',
      objectFit: 'contain',
      maxHeight: fabricate.isNarrow() ? '100vh' : '75vh',
      margin: '2px',
      opacity: '0.2',
      transition: '0.3s',
      borderRadius: '5px',
      overflow: 'hidden',
    })
      .setAttributes({ id: `post-${post.id}` })
      .onClick(() => openPost(post))
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

  const nonImageTile = Card()
    .setStyles({
      width: fabricate.isNarrow() ? '47%' : '30%',
      margin: '4px',
    })
    .setChildren([
      PostTitle({ post })
        .setStyles({ fontSize: '0.9rem', margin: '8px' }),
    ]);

  // Show the image or just the post info
  return hasImage
    ? imageEl!
    : nonImageTile;
};

export default TilePost;
