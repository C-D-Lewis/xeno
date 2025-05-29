/* eslint-disable no-nested-ternary */
import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState, GalleryImageItem, Post } from '../types.ts';
import ImageButton from './ImageButton.ts';
import Card from './Card.ts';
import { decodeHtml, getRevealText } from '../utils.ts';
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
const GalleryImage = ({
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

  const imageEl = fabricate('img')
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
      imgObserver.unobserve(el);
      el.removeEventListener('load', onImageLoad);
    });

  return fabricate('Column')
    .displayWhen((state) => !(isGif || nsfw) || state.visibleMediaPostId === id)
    .setChildren([
      imageEl,
      ImageListControls({ id, imageList }),
    ]);
};

/**
 * GalleryVideo component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post ID.
 * @param {object} [props.videoSourceData] - Video source data.
 * @param {string} [props.videoSourceData.dashUrl] - DASH video URL.
 * @param {string} [props.videoSourceData.fallbackUrl] - Fallback video URL.
 * @returns {FabricateComponent} GalleryVideo component.
 */
const GalleryVideo = ({
  id,
  videoSourceData,
}: {
  id: string;
  videoSourceData?: { dashUrl?: string; fallbackUrl?: string };
}) => fabricate.conditional(
  (state) => state.visibleMediaPostId === id,
  () => fabricate('video')
    .setStyles({ width: '100%', objectFit: 'contain', maxHeight: '75vh' })
    .setAttributes({ controls: 'controls', muted: false })
    .onCreate((el) => {
      if (!videoSourceData) {
        console.warn(`No video source data for post ${id}`);
        return;
      }

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

/**
 * RevealMediaButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post ID.
 * @param {boolean} [props.isGif=false] - Whether the post is a GIF.
 * @param {boolean} [props.nsfw=false] - Whether the post is marked as NSFW.
 * @param {boolean} [props.hasIframeEmbed=false] - Whether the post has an iframe embed.
 * @param {boolean} [props.hasVideo=false] - Whether the post has a video.
 * @param {boolean} [props.hasMediaEmbed=false] - Whether the post has a media embed.
 * @returns {FabricateComponent} RevealMediaButton component.
 */
const RevealMediaButton = ({
  id,
  isGif,
  nsfw,
  hasIframeEmbed,
  hasVideo,
  hasMediaEmbed,
}: {
  id: string;
  isGif: boolean;
  nsfw: boolean;
  hasIframeEmbed: boolean;
  hasVideo: boolean;
  hasMediaEmbed: boolean;
}) => fabricate('Row')
  .setStyles({
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  })
  .onClick(() => {
    fabricate.update({ visibleMediaPostId: id });

    const found = document.getElementById(`post-${id}`) as FabricateComponent<AppState>;
    if (found) found.scrollIntoView({ behavior: 'smooth' });
  })
  .setChildren([
    ImageButton({ src: `assets/play-${isGif ? 'gif' : 'video'}.png` })
      .setStyles({ margin: '12px 0px' }),
    fabricate('Text')
      .setStyles(({ palette }) => ({ color: palette.text }))
      .setText(getRevealText(isGif, hasIframeEmbed, hasVideo, hasMediaEmbed, nsfw)),
  ]);

/**
 * CloseMediaButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post ID.
 * @returns {FabricateComponent} CloseMediaButton component.
 */
const CloseMediaButton = ({
  id,
}: {
  id: string;
}) => fabricate.conditional(
  (state) => state.visibleMediaPostId === id,
  () => fabricate('Row')
    .setStyles({
      alignItems: 'center',
      textAlign: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    })
    .onClick(() => fabricate.update({ visibleMediaPostId: null }))
    .setChildren([
      ImageButton({ src: 'assets/close.png' })
        .setStyles({ margin: '12px 0px' }),
      fabricate('Text')
        .setStyles(({ palette }) => ({ color: palette.text }))
        .setText('Close media'),
    ]),
);

/**
 * GalleryPost component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const GalleryPost = ({ post }: { post: Post }) => {
  const {
    id, iframe, imageSource, videoSourceData, imageList,
    selfText, selfTextHtml, mediaEmbedHtml, nsfw,
  } = post;
  const route = fabricate.getRouteHistory().pop()!;

  const hasVideo = !!videoSourceData;
  const hasIframeEmbed = !!iframe;
  const hasMediaEmbed = !hasIframeEmbed && !!mediaEmbedHtml?.length;
  const hasImage = !hasVideo && !hasIframeEmbed && imageSource;
  const hasSelfText = !!(selfTextHtml || selfText);
  const isGif = !!imageSource?.endsWith('.gif');
  const shouldRevealMedia = hasIframeEmbed || hasVideo || isGif || hasMediaEmbed || nsfw;
  const revealImmediately = route === '/post' && shouldRevealMedia;

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

  const revealMediaButton = RevealMediaButton({
    id, isGif, hasIframeEmbed, hasMediaEmbed, hasVideo, nsfw,
  });
  if (revealImmediately) {
    // Show immediately on PostPage
    revealMediaButton.click();
  }

  return Card()
    .setStyles({ width: fabricate.isNarrow() ? '100vw' : '60vw' })
    .setChildren([
      PostHeader({ post }),
      ...hasImage ? [GalleryImage({
        id,
        imageSource,
        imageList,
        isGif,
        nsfw,
      })] : [],
      ...hasVideo ? [GalleryVideo({ id, videoSourceData })] : [],
      ...hasIframeEmbed ? [iframeEl!] : [],
      ...hasMediaEmbed ? [mediaEmbedEl!] : [],
      fabricate.conditional(
        (state) => shouldRevealMedia && state.visibleMediaPostId !== id,
        () => revealMediaButton,
      ),
      ...shouldRevealMedia && !revealImmediately ? [CloseMediaButton({ id })] : [],
    ])
    .onCreate((el) => {
      if (route !== '/post') return;

      // Show body text only on PostPage
      if (hasSelfText) el.addChildren([BodyText({ text: selfTextHtml || selfText! })]);
    });
};

export default GalleryPost;
