/* eslint-disable no-nested-ternary */
import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState, GalleryImageList, Post } from '../types';
import ImageButton from './ImageButton';
import LinkButton from './LinkButton';
import PostMetrics from './PostMetrics';
import {
  PostAgeView, PostAuthorLink, PostTitle, SubredditPill,
} from './PostWidgets';
import Card from './Card';
import { decodeHtml } from '../utils';

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
 * PostHeader component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @param {boolean} props.isMax - True if max layout required.
 * @returns {HTMLElement} Fabricate component.
 */
const PostHeader = ({ post, isMax }: { post: Post, isMax?: boolean }) => {
  const {
    subreddit, created, author, fallbackSource,
  } = post;

  const postMetadataRow = fabricate('Row')
    .setStyles({ alignItems: 'center' })
    .setChildren([
      PostAuthorLink({ author }),
      SubredditPill({ subreddit }),
      PostAgeView({ created }),
    ]);

  const postTitleRow = fabricate('Row')
    .setStyles({ alignItems: 'center' })
    .setChildren([
      PostTitle({ post }),
      LinkButton({ href: fallbackSource }).displayWhen(
        (state) => state[fabricate.StateKeys.Route] === '/post',
      ),
    ]);

  return fabricate('Column')
    .setStyles(({ palette }) => ({
      backgroundColor: palette.widgetPanel, padding: '8px',
    }))
    .onCreate((el, { lastLaunchTime }) => {
      const createdTime = new Date(created).getTime();
      const isNew = createdTime > lastLaunchTime;

      if (isNew) {
        el.setStyles(({ palette }) => ({
          borderTop: `${palette.primary} 4px solid`,
        }));
      }
    })
    .setChildren([
      ...!isMax ? [postMetadataRow] : [],
      postTitleRow,
      ...!isMax ? [PostMetrics({ post })] : [],
    ]);
};

/**
 * ImageListControls component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post ID.
 * @param {GalleryImageList[]} props.imageList - Image URL list.
 * @returns {FabricateComponent} ImageListControls component.
 */
const ImageListControls = ({ id, imageList }: { id: string, imageList: GalleryImageList[] }) => {
  const numImages = imageList.length;
  if (numImages < 2) return fabricate('div');

  const indexKey = fabricate.buildKey('imageListIndex', id);
  fabricate.update(indexKey, 0);

  const leftArrowImg = ImageButton({ src: 'assets/arrow-left.png' })
    .setStyles({ filter: 'brightness(0.5)', margin: '0px' })
    .onUpdate((el, state) => {
      el.setStyles({ filter: `brightness(${state[indexKey] === 0 ? '0.5' : '1'})` });
    }, [indexKey])
    .onClick((el, state) => {
      if (state[indexKey] === 0) return;

      fabricate.update(indexKey, state[indexKey] - 1);
    });

  const rightArrowImg = ImageButton({ src: 'assets/arrow-right.png' })
    .setStyles({ margin: '0px' })
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

  const currentIndexText = fabricate('Text')
    .setStyles(({ palette }) => ({
      margin: '0px 5px',
      fontSize: '0.9rem',
      color: palette.text,
    }))
    .setText(`1/${numImages}`)
    .onUpdate(
      (el, state) => el.setText(`${state[indexKey] + 1}/${numImages}`),
      [indexKey],
    );

  return fabricate('Row')
    .setStyles({ alignItems: 'center', margin: '5px auto' })
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
 * @param {boolean} props.isMax - True if max layout required.
 * @returns {HTMLElement} Fabricate component.
 */
const GalleryPost = ({ post, isMax }: { post: Post, isMax?: boolean }) => {
  const {
    id, iframe, imageSource, videoSourceData, imageList, selfText, selfTextHtml, mediaEmbedHtml,
  } = post;

  const indexKey = fabricate.buildKey('imageListIndex', id);
  const hasVideo = !!videoSourceData;
  const hasIframeEmbed = !!iframe;
  const hasMediaEmbed = !hasIframeEmbed && !!mediaEmbedHtml?.length;
  const hasImage = !hasVideo && !hasIframeEmbed && imageSource;
  const showSelfText = !!(selfTextHtml || selfText);
  const isGif = imageSource?.endsWith('.gif');

  const maxImageHeight = isMax
    ? '100vh'
    : fabricate.isNarrow() ? '70vh' : '75vh';

  const imageEl = hasImage
    ? fabricate('img')
      .setStyles({
        cursor: 'pointer',
        width: '100%',
        height: 'auto',
        objectFit: 'contain',
        maxHeight: maxImageHeight,
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

        el.addEventListener('load', () => el.setStyles({ opacity: '1' }));
      })
    : undefined;
  if (imageEl && isGif) imageEl.displayWhen((state) => state.visibleMediaPostId === id);

  /**
   * Video element component.
   *
   * @returns {FabricateComponent} Component.
   */
  const VideoElement = () => fabricate.conditional(
    (state) => state.visibleMediaPostId === id,
    () => fabricate('video')
      .setStyles({ width: '100%', objectFit: 'cover' })
      .setAttributes({ controls: 'controls', muted: false })
      .onCreate((el) => {
        // Try DASH
        if (videoSourceData) {
          if (!videoSourceData.dashUrl) {
            // Fallback
            el.setAttributes({ src: videoSourceData.fallbackUrl });
          } else {
            // Use dashjs
            const player = dashjs.MediaPlayer().create();
            player.initialize(el, videoSourceData.dashUrl, false);
          }
        }
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

  const revealEmbedButton = fabricate('Row')
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

  const maxCardWidth = isMax
    ? '100vw'
    : fabricate.isNarrow() ? '95vw' : '48vw';
  return Card()
    .setStyles({ width: maxCardWidth })
    .setChildren([
      PostHeader({ post, isMax }),
      ...hasImage ? [imageEl!] : [],
      ...hasVideo ? [VideoElement()] : [],
      ...hasIframeEmbed ? [iframeEl!] : [],
      ...hasMediaEmbed ? [mediaEmbedEl!] : [],
      revealEmbedButton,
      ImageListControls({ id, imageList }),
    ])
    .onCreate((el, state) => {
      if (state[fabricate.StateKeys.Route] !== '/post') return;

      // Show body text only on PostPage
      if (showSelfText) el.addChildren([BodyText({ text: selfTextHtml || selfText! })]);
    });
};

export default GalleryPost;
