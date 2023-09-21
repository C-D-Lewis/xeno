import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../theme';
import { AppState, Post } from '../types';
import {
  delayedScrollTop, getContrastColor, getSubredditColor, getTimeAgoStr, navigate,
} from '../utils';
import { fetchPosts } from '../services/ApiService';

declare const fabricate: Fabricate<AppState>;

/**
 * PostAuthorLink component.
 *
 * @param {object} props - Component props.
 * @param {string} props.author - Author name.
 * @param {boolean} [props.isPostAuthor] - true if this is by the OP.
 * @returns {FabricateComponent} PostAuthorLink component.
 */
export const PostAuthorLink = ({
  author,
  isPostAuthor = false,
}: {
  author: string,
  isPostAuthor?: boolean,
}) => {
  const fullAuthor = `/u/${author}`;
  return fabricate('Text')
    .setText(fullAuthor)
    .setStyles({
      color: Theme.palette.textSecondary,
      cursor: 'pointer',
      fontSize: '0.9rem',
      margin: '0px 5px',
      padding: isPostAuthor ? '2px' : '0px',
      borderRadius: isPostAuthor ? '5px' : '0px',
      backgroundColor: isPostAuthor
        ? Theme.PostAuthorLink.isPostAuthor
        : Theme.palette.transparent,
    })
    .onClick(async (el, { accessToken, page, sortMode }) => {
      if (!accessToken) return;

      delayedScrollTop();
      await fabricate.update({ query: fullAuthor });

      if (page === 'ListPage') {
        fetchPosts(accessToken, fullAuthor, sortMode);
      } else {
        navigate(page, 'ListPage');
      }
    });
};

/**
 * SubredditPill component.
 *
 * @param {object} props - Component props.
 * @param {string} props.subreddit - Subreddit name
 * @returns {FabricateComponent} SubredditPill component.
 */
export const SubredditPill = ({ subreddit }: { subreddit: string }) => fabricate('Pill', {
  text: subreddit,
  backgroundColor: Theme.palette.primary,
})
  .setStyles({
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '2px 6px',
    margin: '0px 5px',
  })
  .onCreate((el, state) => {
    const backgroundColor = getSubredditColor(state, subreddit);
    el.setStyles({
      backgroundColor,
      color: getContrastColor(backgroundColor),
    });
  })
  .onClick(async (el, { accessToken, page, sortMode }) => {
    if (!accessToken) return;

    const query = `/r/${subreddit}`;
    delayedScrollTop();
    await fabricate.update({ query });

    // If already on ListPage, update the content. Else, go there.
    if (page === 'ListPage') {
      fetchPosts(accessToken, query, sortMode);
    } else {
      navigate(page, 'ListPage');
    }
  });

/**
 * PostAgeView component.
 *
 * @param {object} props - Component props.
 * @param {number} props.created - Created time.
 * @returns {FabricateComponent} PostAgeView component.
 */
export const PostAgeView = ({ created }: { created: number }) => {
  const ageText = fabricate('Text')
    .setText(getTimeAgoStr(created))
    .setStyles({
      color: Theme.PostHeader.date,
      fontSize: '0.9rem',
      cursor: 'default',
      margin: '0px 5px',
    });

  return fabricate('Row')
    .setStyles({ alignItems: 'center' })
    .setChildren([ageText]);
};

/**
 * PostTitle component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - The post.
 * @returns {FabricateComponent} PostTitle component.
 */
export const PostTitle = ({ post }: { post: Post }) => fabricate('Text')
  .setText(post.title)
  .setAttributes({ id: `post-${post.id}` })
  .setStyles({
    color: Theme.palette.text,
    cursor: 'pointer',
    margin: '5px',
    fontSize: '1rem',
    fontWeight: 'bold',
  })
  .onClick(async (el, { page }) => {
    if (page === 'PostPage') {
      window.open(`https://reddit.com${post.permalink}`, '_blank');
      return;
    }

    if (['ListPage', 'FeedPage'].includes(page)) {
      delayedScrollTop();
      await fabricate.update({ selectedPost: post });
      navigate(page, 'PostPage');
    }
  });
