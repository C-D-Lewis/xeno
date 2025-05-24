import { Fabricate } from 'fabricate.js';
import { AppState, Post } from '../types.ts';
import LinkButton from './LinkButton.ts';
import PostMetrics from './PostMetrics.ts';
import PostAgeView from './PostAgeView.ts';
import PostAuthorLink from './PostAuthorLink.ts';
import PostTitle from './PostTitle.ts';
import SubredditPill from './SubredditPill.ts';

declare const fabricate: Fabricate<AppState>;

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
      LinkButton({ href: fallbackSource })
        .displayWhen(
          (state) => state[fabricate.StateKeys.Route] === '/post',
        ),
    ]);

  return fabricate('Column')
    .setStyles(({ palette }) => ({
      backgroundColor: palette.widgetPanel,
      padding: '8px',
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
      postMetadataRow,
      postTitleRow,
      PostMetrics({ post }),
    ]);
  // Strange behavior when navigating to subreddit pill or back etc
  // .onClick(() => {
  //   const route = fabricate.getRouteHistory().pop()!;
  //   if (route !== '/post') openPost(post);
  // });
};

export default PostHeader;
