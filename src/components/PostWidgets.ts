import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../theme';
import { AppState, Post } from '../types';
import {
  delayedScrollTop, getContrastColor, getSubredditColor, getTimeAgoStr,
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
    .setStyles(({ palette }) => ({
      color: palette.textSecondary,
      cursor: 'pointer',
      fontSize: '0.9rem',
      margin: '0px 5px',
      padding: isPostAuthor ? '2px' : '0px',
      borderRadius: isPostAuthor ? '5px' : '0px',
      backgroundColor: isPostAuthor
        ? Theme.PostAuthorLink.isPostAuthor
        : palette.transparent,
    }))
    .onClick((el, state) => {
      const { accessToken, sortMode } = state;
      if (!accessToken) return;

      delayedScrollTop();
      fabricate.update({ query: fullAuthor });

      // Go there and load
      fetchPosts(accessToken, fullAuthor, sortMode);
      fabricate.navigate('/list');
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
  .onUpdate((el, state) => {
    const backgroundColor = getSubredditColor(state, subreddit);
    el.setStyles({
      backgroundColor,
      color: getContrastColor(backgroundColor),
    });
  }, [fabricate.StateKeys.Created])
  .onClick((el, state) => {
    const { accessToken, sortMode } = state;
    if (!accessToken) return;

    const query = `/r/${subreddit}`;
    delayedScrollTop();
    fabricate.update({ query });

    // Go there and load
    fetchPosts(accessToken, query, sortMode);
    fabricate.navigate('/list');
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
  .setStyles(({ palette }) => ({
    color: palette.text,
    cursor: 'pointer',
    margin: '5px',
    fontSize: '1rem',
    fontWeight: 'bold',
  }))
  .onClick((el, state) => {
    const route = state[fabricate.StateKeys.Route];
    if (route === '/post') {
      window.open(`https://reddit.com${post.permalink}`, '_blank');
      return;
    }

    if (['/list', '/feed'].includes(route)) {
      delayedScrollTop();
      fabricate.update({ selectedPost: post, drawerOpen: false });
      fabricate.navigate('/post');
    }
  });
