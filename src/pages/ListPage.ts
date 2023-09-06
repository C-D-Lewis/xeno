import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import GalleryPost from '../components/GalleryPost';
import ListPost from '../components/ListPost';
import AppLoader from '../components/AppLoader';
import AppPage from '../components/AppPage';
import { fetchPosts } from '../services/ApiService';
import Theme from '../theme';
import { getContrastColor, styleIconContrastColor } from '../utils';
import ImageButton from '../components/ImageButton';

declare const fabricate: Fabricate<AppState>;

/** Scroll interval in millis */
const SCROLL_INTERVAL_MS = 200;

/**
 * Determine if an element is in view.
 *
 * @param {FabricateComponent} el - Element to test.
 * @returns {boolean} true if in view.
 */
const isInViewPort = (el: FabricateComponent<AppState>) => el.getBoundingClientRect().top >= -10;

/**
 * Scroll a post into view until it is.
 *
 * @param {FabricateComponent} el - Component to scroll to.
 */
const scrollToPost = (el: FabricateComponent<AppState>) => {
  el.scrollIntoView();

  // Check again until in view
  setTimeout(() => {
    const postInView = isInViewPort(el);
    if (postInView) return;

    scrollToPost(el);
  }, SCROLL_INTERVAL_MS);
};

/**
 * FeedToggle component.
 *
 * @returns {FabricateComponent} Fabricate component.
 */
export const FeedToggle = () => {
  /**
   * When created or updated.
   *
   * @param {FabricateComponent} el - Element to update.
   * @param {AppState} state - App state.
   */
  const updateLayout = (el: FabricateComponent<AppState>, { feedList, query }: AppState) => {
    const savedNow = feedList.includes(query);
    el.setStyles({ backgroundColor: savedNow ? Theme.palette.primary : Theme.palette.transparent });
  };

  return ImageButton({ src: 'assets/feed.png' })
    .setStyles({
      width: '24px',
      height: '24px',
      padding: '2px',
    })
    .onCreate(updateLayout)
    .onUpdate(updateLayout, ['feedList', 'page'])
    .onClick((el, { feedList, query }) => {
      const nextState = !feedList.includes(query);

      fabricate.update({
        feedList: nextState
          ? [...feedList, query]
          : feedList.filter((p) => p !== query),
      });
    });
};

/**
 * SubredditHeader component.
 *
 * @returns {FabricateComponent} SubredditHeader component.
 */
const SubredditHeader = () => {
  const icon = fabricate('Image', { src: 'assets/icon.png' })
    .setStyles({
      height: '48px',
      width: '48px',
      margin: '8px',
      borderRadius: '50px',
    });

  const title = fabricate('Text')
    .setStyles({
      color: Theme.palette.text,
      fontSize: '1.2rem',
      fontWeight: 'bold',
    });

  const description = fabricate('Text')
    .setStyles({
      color: Theme.palette.text,
      fontSize: '0.9rem',
    });

  /**
   * When created or updated.
   *
   * @param {FabricateComponent} el - Element to update.
   * @param {AppState} state - App state.
   */
  const updateLayout = (el: FabricateComponent<AppState>, state: AppState) => {
    const { subreddit } = state;
    if (!subreddit) return;

    const {
      displayNamePrefixed, iconImg, primaryColor, publicDescription,
    } = subreddit;

    // Icon
    const color = getContrastColor(primaryColor);
    icon.setAttribute('src', iconImg || 'assets/icon.png');
    if (!iconImg) {
      styleIconContrastColor(icon, primaryColor);
    } else {
      icon.setStyles({ filter: 'none' });
    }

    // Others
    title.setText(displayNamePrefixed);
    title.setStyles({ color });
    description.setText(publicDescription.trim());
    description.setStyles({ color });
    el.setStyles({ backgroundColor: primaryColor });
  };

  return fabricate('Row')
    .setStyles({
      padding: '4px',
      borderBottomLeftRadius: '5px',
      borderBottomRightRadius: '5px',
    })
    .setChildren([
      icon,
      fabricate('Column')
        .setChildren([
          fabricate('Row')
            .setStyles({ alignItems: 'center' })
            .setChildren([title, FeedToggle()]),
          description,
          // Add to feed?
        ]),
    ])
    .onCreate(updateLayout);
  // .onUpdate(updateLayout, ['query', 'subreddit']);
};

/**
 * ListPage component.
 *
 * @returns {FabricateComponent} ListPage component.
 */
const ListPage = () => {
  /**
   * When created or updated.
   *
   * @param {FabricateComponent} el - Element to update.
   * @param {AppState} state - App state.
   */
  const updateLayoutAndPosts = (
    el: FabricateComponent<AppState>,
    { posts, displayMode }: AppState,
  ) => {
    el.setChildren(
      posts.map((post) => (displayMode === 'gallery' ? GalleryPost({ post }) : ListPost({ post }))),
    );
  };

  /**
   * When ListPage is created.
   *
   * @param {FabricateComponent} el - The element.
   * @param {AppState} state - App state.
   */
  const onCreate = async (el: FabricateComponent<AppState>, state: AppState) => {
    // Reload data if returning from settings page
    const {
      accessToken, query, sortMode, lastPage,
    } = state;
    if (!accessToken) return;

    // Initial load or settings changed, refresh posts
    if (!lastPage || lastPage === 'SettingsPage') {
      await fetchPosts(accessToken, query, sortMode);
    } else {
      updateLayoutAndPosts(el, state);
    }

    // If navigating back, scroll to the viewed post
    const { selectedPost } = state;
    if (selectedPost && lastPage !== 'SettingsPage') {
      setTimeout(() => {
        const found = document.getElementById(`post-${selectedPost.id}`) as FabricateComponent<AppState>;
        if (!found) return;

        scrollToPost(found);
      }, SCROLL_INTERVAL_MS);
    }
  };

  const postContainerRow = fabricate('Row')
    .setStyles({
      padding: '5px 0px',
      flex: '1',
      flexWrap: 'wrap',
      margin: 'auto',
    })
    .onCreate(onCreate)
    .onUpdate((el, state) => {
      updateLayoutAndPosts(el, state);
    }, ['posts']);

  return AppPage()
    .setChildren([
      AppLoader().displayWhen(({ postsLoading }) => postsLoading),
      fabricate.conditional(({ postsLoading }) => !postsLoading, SubredditHeader),
      postContainerRow,
    ]);
};

export default ListPage;
