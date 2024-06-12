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
    subreddit, created, author, fallbackSource,
  } = post;

  return fabricate('Column')
    .setStyles(({ palette }) => ({
      padding: '8px', backgroundColor: palette.widgetPanel,
    }))
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
