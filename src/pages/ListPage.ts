import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import AppLoader from '../components/AppLoader';
import AppPage from '../components/AppPage';
import SubredditHeader from '../components/SubredditHeader';
import PostList from '../components/PostList';
import { fetchPosts } from '../services/ApiService';

declare const fabricate: Fabricate<AppState>;

/**
 * ListPage component.
 *
 * Can be a subreddit or user feed.
 *
 * @returns {FabricateComponent} ListPage component.
 */
const ListPage = () => AppPage()
  .setChildren([
    AppLoader().displayWhen(({ postsLoading }) => postsLoading),
    fabricate.conditional(({ postsLoading }) => !postsLoading, SubredditHeader),
    PostList().displayWhen(({ postsLoading }) => !postsLoading),
  ])
  .onCreate((el, state) => {
    const { accessToken, query, sortMode } = state;

    fabricate.update({ landingPage: '/list' });

    // Load list page content
    fetchPosts(accessToken!, query, sortMode);
  });

export default ListPage;
