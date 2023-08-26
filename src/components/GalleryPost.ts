import { Fabricate, FabricateComponent } from 'fabricate.js/types/fabricate';
import Theme from '../theme';
import { AppState, Post } from '../types';
import ImageButton from './ImageButton';
import LinkButton from './LinkButton';
import PostMetrics from './PostMetrics';
import {
  PostAgeView, PostAuthorLink, PostTitle, SubredditPill,
} from './PostWidgets';
import Card from './Card';
import { decodeHtml } from '../utils';

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
 * PostHeader component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const PostHeader = ({ post }: { post: Post }) => {
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
      LinkButton({ href: fallbackSource }),
    ]);

  return fabricate('Column')
    .setStyles({ backgroundColor: Theme.palette.widgetPanel, padding: '8px' })
    .onCreate((el, { newSinceTime }) => {
      const createdTime = new Date(created * 1000).getTime();
      const isNew = createdTime > newSinceTime;

      if (isNew) el.setStyles({ borderTop: `${Theme.palette.primary} 4px solid` });
    })
    .setChildren([
      postMetadataRow,
      postTitleRow,
      PostMetrics({ post }),
    ]);
};

/**
 * ImageListControls component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post ID.
 * @param {string[]} props.imageList - Image URL list.
 * @returns {FabricateComponent} ImageListControls component.
 */
const ImageListControls = ({ id, imageList }: { id: string, imageList: string[] }) => {
  if (imageList.length < 2) return fabricate('div');

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
        filter: `brightness(${state[indexKey] === imageList.length - 1 ? '0.5' : '1'})`,
      });
    }, [indexKey])
    .onClick((el, state) => {
      if (state[indexKey] === imageList.length - 1) return;

      fabricate.update(
        indexKey,
        Math.min(state[indexKey] + 1, imageList.length),
      );
    });

  const currentIndexText = fabricate('Text')
    .setStyles({
      margin: '0px 5px',
      fontSize: '0.9rem',
      color: Theme.palette.text,
    })
    .setText(`1/${imageList.length}`)
    .onUpdate(
      (el, state) => el.setText(`${state[indexKey] + 1}/${imageList.length}`),
      [indexKey],
    );

  return fabricate('Row')
    .setStyles({ alignItems: 'center', margin: '5px auto' })
    .displayWhen(() => !!imageList.length)
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
  .setStyles({
    fontSize: '0.9rem',
    color: Theme.palette.text,
    padding: '8px',
    borderRadius: '5px',
    backgroundColor: Theme.palette.widgetBackground,
  })
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
    id, iframe, imageSource, videoSource, imageList, selfText, selfTextHtml,
  } = post;

  const indexKey = fabricate.buildKey('imageListIndex', id);
  const showVideo = !!videoSource;
  const showIframe = !!iframe;
  const showImage = !showVideo && !showIframe && imageSource;
  const showSelfText = !!(selfTextHtml || selfText);

  const imageEl = showImage
    ? fabricate('img')
      .setStyles({
        cursor: 'pointer',
        width: '100%',
        height: 'auto',
        objectFit: 'cover',
        margin: 'auto',
        opacity: '0.2',
        transition: '0.3s',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '5px',
      })
      .onClick(() => window.open(imageSource, '_blank'))
      .onUpdate((el, state) => {
        if (!imageList.length) return;

        el.setAttributes({ src: imageList[state[indexKey]] });
      }, [indexKey])
      .onCreate((el) => {
        el.dataset.src = imageSource;
        imgObserver.observe(el);

        el.addEventListener('load', () => el.setStyles({ opacity: '1' }));
      })
    : undefined;

  const videoEl = showVideo
    ? fabricate('video')
      .setStyles({ width: '100%', objectFit: 'cover' })
      .setAttributes({ src: videoSource, controls: 'controls' })
    : undefined;

  const iframeEl = showIframe
    ? fabricate('div')
      .onUpdate(
        (el, { visibleIframe }) => el.setHtml(visibleIframe === id ? iframe! : ''),
        ['visibleIframe'],
      )
    : undefined;

  const revealEmbedButton = ImageButton({ src: 'assets/magnify.png' })
    .setStyles({ margin: '10px auto' })
    .displayWhen(({ visibleIframe }) => showIframe && visibleIframe !== id)
    .onClick(() => fabricate.update({ visibleIframe: id }));

  return Card()
    .setStyles({ width: fabricate.isNarrow() ? '95vw' : '29vw' })
    .setChildren([
      PostHeader({ post }),
      ...showImage ? [imageEl!] : [],
      ...videoSource ? [videoEl!] : [],
      ...showIframe ? [iframeEl!] : [],
      revealEmbedButton,
      ImageListControls({ id, imageList }),
    ])
    .onCreate((el, { page }) => {
      if (page !== 'PostPage') return;

      // Always wide on PostPage (Depends on container width)
      el.setStyles({ width: '48vw' });

      // Show body text only on detail page
      if (showSelfText) el.addChildren([BodyText({ text: selfTextHtml || selfText! })]);
    });
};

export default GalleryPost;
