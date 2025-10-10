import { Fabricate } from 'fabricate.js';
import { AppState, Post } from '../types.ts';
import LinkButton from './LinkButton.ts';
import PostMetrics from './posts/Metrics.ts';
import Card from './Card.ts';
import PostAgeView from './posts/AgeView.ts';
import PostAuthorLink from './posts/AuthorLink.ts';
import PostTitle from './posts/PostTitle.ts';
import SubredditPill from './posts/SubredditPill.ts';

declare const fabricate: Fabricate<AppState>;
declare const fab: Fabricate<AppState>;

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
      fab('Row', { alignItems: 'center' }, [
        PostTitle({ post }),
        LinkButton({ href: fallbackSource }),
      ]),
      fab('Row', { marginTop: 'auto', flexWrap: 'wrap' }, [
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
  .setStyles({ width: fabricate.isNarrow() ? '100%' : '50vw' })
  .setChildren([PostSummary({ post })]);

export default ListPost;
