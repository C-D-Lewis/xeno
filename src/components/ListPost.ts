import { Fabricate } from 'fabricate.js';
import { AppState, Post } from '../types';
import {
  PostAgeView, PostAuthorLink, PostTitle, SubredditPill,
} from './PostWidgets';
import LinkButton from './LinkButton';
import PostMetrics from './PostMetrics';
import Card from './Card';

declare const fabricate: Fabricate<AppState>;

// Lazy load images since some tags include a lot of posts
const imgObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.intersectionRatio <= 0) return;

    const img = entry.target as HTMLImageElement;
    img.src = img.dataset.src!;
    imgObserver.unobserve(img);
  });
}, { root: null, rootMargin: '0px', threshold: 0.5 });

/**
 * PostSummary component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const PostSummary = ({ post }: { post: Post }) => {
  const {
    subreddit, created, author, thumbnail, imageSource, fallbackSource, selfText,
  } = post;

  const showImage = (imageSource || thumbnail) && !selfText;

  const thumbnailEl = fabricate('img')
    .setStyles({
      cursor: 'pointer',
      width: '75px',
      height: 'auto',
      objectFit: 'cover',
      maxHeight: '75px',
      margin: '5px 10px 5px 5px',
      borderRadius: '5px',
      transition: '0.3s',
      borderBottomLeftRadius: '5px',
      borderBottomRightRadius: '5px',
    })
    .onClick(() => {
      if (imageSource) window.open(imageSource, '_blank');
    })
    .onUpdate((el) => {
      // Use thumbnail by default
      el.setAttributes({ src: thumbnail });

      // No image or is a text post
      if (!showImage) {
        el.setAttributes({ src: 'assets/textpost.png' });
        el.setStyles({
          width: '40px',
          height: '40px',
          padding: '14px',
        });
        return;
      }

      // No full image source identified, use thumbnail
      if (!imageSource) return;

      // Lazy load when in view
      el.setStyles({ opacity: '0.2' });
      el.dataset.src = imageSource;
      imgObserver.observe(el);

      // Detect failure to load
      el.addEventListener('load', () => el.setStyles({ opacity: '1' }));
      el.onEvent('error', () => el.setAttributes({ src: 'assets/gallerypost.png' }));
    }, [fabricate.StateKeys.Created]);

  const itemContent = fabricate('Column')
    .setChildren([
      fabricate('Row')
        .setStyles({ alignItems: 'center' })
        .setChildren([
          PostTitle({ post }),
          LinkButton({ href: fallbackSource }),
        ]),
      fabricate('Row')
        .setStyles({ marginTop: 'auto', flexWrap: 'wrap' })
        .setChildren([
          PostAuthorLink({ author }),
          SubredditPill({ subreddit }),
          PostAgeView({ created }),
        ]),
      PostMetrics({ post }),
    ]);

  return fabricate('Row')
    .setStyles(({ palette }) => ({
      padding: '8px', backgroundColor: palette.widgetPanel,
    }))
    .setChildren([thumbnailEl, itemContent]);
};

/**
 * Post component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const ListPost = ({ post }: { post: Post }) => Card()
  .setStyles({ width: '100%' })
  .setChildren([PostSummary({ post })]);

export default ListPost;
