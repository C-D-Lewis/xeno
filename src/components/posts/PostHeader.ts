import { Fabricate } from 'fabricate.js';
import { AppState, Post } from '../../types.ts';
import LinkButton from '../LinkButton.ts';
import PostMetrics from './Metrics.ts';
import PostAgeView from './AgeView.ts';
import PostAuthorLink from './AuthorLink.ts';
import PostTitle from './PostTitle.ts';
import SubredditPill from './SubredditPill.ts';

declare const fabricate: Fabricate<AppState>;
declare const fab: Fabricate<AppState>;

/**
 * PostHeader component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const PostHeader = ({ post }: { post: Post }) => {
  const {
    subreddit, created, author, fallbackSource, isNew,
  } = post;

  const postMetadataRow = fab('Row', { alignItems: 'center' }, [
    PostAuthorLink({ author }),
    SubredditPill({ subreddit }),
    PostAgeView({ created }),
  ]);

  const postTitleRow = fab('Row', { alignItems: 'center' }, [
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
    .onCreate((el) => {
      const route = fabricate.getRoute();
      if (route === '/feed' && isNew) {
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
  //   const route = fabricate.getRoute()!;
  //   if (route !== '/post') openPost(post);
  // });
};

export default PostHeader;
