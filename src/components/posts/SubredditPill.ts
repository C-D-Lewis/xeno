import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../../theme.ts';
import { AppState } from '../../types.ts';
import {
  delayedScrollTop, getContrastColor, getSubredditColor,
} from '../../utils.ts';
import { fetchPosts } from '../../services/ApiService.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * SubredditPill component.
 *
 * @param {object} props - Component props.
 * @param {string} props.subreddit - Subreddit name
 * @returns {FabricateComponent} SubredditPill component.
 */
const SubredditPill = ({ subreddit }: { subreddit: string }) => fabricate('Pill', {
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

    if (fabricate.getRoute() !== '/list') {
      fabricate.navigate('/list');
    }
    fetchPosts(accessToken!, newQuery, sortMode);
  });

export default SubredditPill;
