/* eslint-disable no-nested-ternary */
import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState, GalleryImageItem, Post } from '../types.ts';
import ImageButton from './ImageButton.ts';
import Card from './Card.ts';
import { decodeHtml } from '../utils.ts';
import PostHeader from './PostHeader.ts';

declare const fabricate: Fabricate<AppState>;
declare const dashjs: {
  MediaPlayer: () => ({
    create: () => ({
      initialize: (e: HTMLElement, s: string, b: boolean) => void;
      setAutoPlay: (b: boolean) => void;
    }),
  });
};

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

  const leftArrowImg = ImageButton({ src: 'assets/arrow-left.png' })
    .setStyles({
      filter: 'brightness(0.5)',
      margin: '0px',
      width: '100%',
      height: '32px',
      objectFit: 'contain',
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
      padding: '0px 15px',
      fontSize: '1rem',
      color: palette.text,
    }))
    .setText(`1/${numImages}`)
    .onUpdate(
      (el, state) => el.setText(`${state[indexKey] + 1}/${numImages}`),
      [indexKey],
    );

  const rightArrowImg = ImageButton({ src: 'assets/arrow-right.png' })
    .setStyles({
      margin: '0px',
      width: '100%',
      objectFit: 'contain',
      height: '32px',
    })
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

/**
 * BodyText component.
 *
 * @param {object} props - Component props.
 * @param {string} props.text - Post self text HTML.
 * @returns {FabricateComponent} BodyText component.
 */
const BodyText = ({ text }: { text: string }) => fabricate('Text')
  .setStyles(({ palette }) => ({
    fontSize: '0.9rem',
    color: palette.text,
    padding: '8px',
    borderRadius: '5px',
    backgroundColor: palette.widgetBackground,
  }))
  .setHtml(decodeHtml(text) || 'Failed to load text post');

/**
 * GalleryPost component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const GalleryPost = ({ post }: { post: Post }) => {
  const {
    id, iframe, imageSource, videoSourceData, imageList, selfText, selfTextHtml, mediaEmbedHtml,
  } = post;

  const indexKey = fabricate.buildKey('imageListIndex', id);
  const hasVideo = !!videoSourceData;
  const hasIframeEmbed = !!iframe;
  const hasMediaEmbed = !hasIframeEmbed && !!mediaEmbedHtml?.length;
  const hasImage = !hasVideo && !hasIframeEmbed && imageSource;
  const hasSelfText = !!(selfTextHtml || selfText);
  const isGif = imageSource?.endsWith('.gif');

  /**
   * When the image is loaded, set the opacity to 1.
   *
   * @param {Event} e - Event.
   * @returns {void}
   */
  const onImageLoad = (e: Event) => {
    const el = e.target as FabricateComponent<AppState>;
    el.setStyles({ opacity: '1' });
  };

  const imageEl = hasImage
    ? fabricate('img')
      .setStyles({
        cursor: 'pointer',
        width: '100%',
        height: 'auto',
        objectFit: 'contain',
        maxHeight: fabricate.isNarrow() ? '100vh' : '75vh',
        margin: 'auto',
        opacity: '0.2',
        transition: '0.3s',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '5px',
      })
      .onClick(() => window.open(imageSource, '_blank'))
      .onUpdate((el, state) => {
        if (!imageList.length) return;

        el.setStyles({ opacity: '0.4' });
        el.setAttributes({ src: imageList[state[indexKey]].url });
      }, [indexKey])
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
  if (imageEl && isGif) imageEl.displayWhen((state) => state.visibleMediaPostId === id);

  const videoEl = fabricate.conditional(
    (state) => state.visibleMediaPostId === id,
    () => fabricate('video')
      .setStyles({ width: '100%', objectFit: 'cover' })
      .setAttributes({ controls: 'controls', muted: false })
      .onCreate((el) => {
        if (!videoSourceData) return;

        if (!videoSourceData.dashUrl) {
          // Fallback
          el.setAttributes({ src: videoSourceData.fallbackUrl });
          return;
        }

        // Use dashjs
        const player = dashjs.MediaPlayer().create();
        player.initialize(el, videoSourceData.dashUrl, false);
      }),
  );

  const iframeEl = hasIframeEmbed
    ? fabricate('div')
      .onUpdate(
        (el, { visibleMediaPostId }) => el.setHtml(visibleMediaPostId === id ? iframe! : ''),
        ['visibleMediaPostId'],
      )
    : undefined;

  // At least YouTube
  const mediaEmbedEl = hasMediaEmbed
    ? fabricate('Row')
      .setStyles({ justifyContent: 'center' })
      .onUpdate(
        (el, { visibleMediaPostId }) => {
          el.innerHTML = visibleMediaPostId === id ? decodeHtml(mediaEmbedHtml)! : '';
        },
        ['visibleMediaPostId'],
      )
    : undefined;

  const revealEmbedEl = fabricate('Row')
    .setStyles({
      alignItems: 'center',
      textAlign: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    })
    .displayWhen(
      (state) => !!(
        (hasIframeEmbed || hasVideo || isGif || hasMediaEmbed) && state.visibleMediaPostId !== id),
    )
    .onClick(() => fabricate.update({ visibleMediaPostId: id }))
    .setChildren([
      ImageButton({ src: `assets/play-${isGif ? 'gif' : 'video'}.png` })
        .setStyles({ margin: '12px 0px' }),
      fabricate('Text')
        .setStyles(({ palette }) => ({ color: palette.text }))
        .setText(isGif ? 'Show gif' : 'Show video'),
    ]);

  return Card()
    .setStyles({ width: fabricate.isNarrow() ? '100vw' : '50vw' })
    .setChildren([
      PostHeader({ post }),
      ...hasImage ? [imageEl!] : [],
      ...hasVideo ? [videoEl] : [],
      ...hasIframeEmbed ? [iframeEl!] : [],
      ...hasMediaEmbed ? [mediaEmbedEl!] : [],
      revealEmbedEl,
      ImageListControls({ id, imageList }),
    ])
    .onCreate((el) => {
      const route = fabricate.getRouteHistory().pop()!;
      if (route !== '/post') return;

      // Show body text only on PostPage
      if (hasSelfText) el.addChildren([BodyText({ text: selfTextHtml || selfText! })]);
    });
};

export default GalleryPost;
