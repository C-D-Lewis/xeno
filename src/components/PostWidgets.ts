import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../theme.ts';
import { AppState, Post } from '../types.ts';
import {
  delayedScrollTop, getContrastColor, getSubredditColor, getTimeAgoStr,
} from '../utils.ts';
import { fetchPosts } from '../services/ApiService.ts';

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

      fabricate.update({ query: fullAuthor });
      delayedScrollTop();

      if (fabricate.getRouteHistory().pop()! !== '/list') {
        fabricate.navigate('/list');
      }
      fetchPosts(accessToken!, fullAuthor, sortMode);
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
  .onClick((el, state) => {
    const { accessToken, sortMode } = state;

    const newQuery = `/r/${subreddit}`;
    fabricate.update({ query: newQuery });
    delayedScrollTop();

    if (fabricate.getRouteHistory().pop()! !== '/list') {
      fabricate.navigate('/list');
    }
    fetchPosts(accessToken!, newQuery, sortMode);
  });

/**
 * PostAgeView component.
 *
 * @param {object} props - Component props.
 * @param {number} props.created - Created time.
 * @returns {FabricateComponent} PostAgeView component.
 */
export const PostAgeView = ({ created }: { created: number }) => {
  let updateHandle: NodeJS.Timer;
  const ageText = fabricate('Text')
    .setText(getTimeAgoStr(created))
    .setStyles({
      color: Theme.PostHeader.date,
      fontSize: '0.9rem',
      cursor: 'default',
      margin: '0px 5px',
    })
    .onCreate(() => {
      updateHandle = setInterval(() => {
        ageText.setText(getTimeAgoStr(created));
      }, 60 * 1000);
    })
    .onDestroy(() => clearInterval(updateHandle));

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
export const PostTitle = ({ post }: { post: Post }) => {
  const finalPostTitle = post.title
    .split('&amp;').join('&');

  return fabricate('Text')
    .setText(finalPostTitle)
    .setAttributes({ id: `post-${post.id}` })
    .setStyles(({ palette }) => ({
      color: palette.text,
      cursor: 'pointer',
      margin: '5px',
      fontSize: '1.1rem',
      fontWeight: 'bold',
    }))
    .onClick(() => {
      const route = fabricate.getRouteHistory().pop()!;
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
};
