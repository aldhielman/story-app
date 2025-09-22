import StoryListPage from '../pages/story/story-list-page.js';
import StoryDetailPage from '../pages/story/story-detail-page.js';
import LoginPage from '../pages/auth/login-page.js';
import RegisterPage from '../pages/auth/register-page.js';
import AddStoryPage from '../pages/story/add-story-page.js';
import BookmarkPage from '../pages/bookmark/bookmark-page.js';
import OfflineStoriesPage from '../pages/offline/offline-stories-page.js';
import { redirectIfAuthenticated, requireAuth } from '../utils/auth-utils.js';

const routes = {
  '/': () =>requireAuth(new StoryListPage()),
  '/story': () =>requireAuth(new StoryListPage()),
  '/story/:id': () =>requireAuth(new StoryDetailPage()),
  '/add-story': () =>requireAuth(new AddStoryPage()),
  '/bookmark': () =>requireAuth(new BookmarkPage()),
  '/offline-stories': () =>requireAuth(new OfflineStoriesPage()),

  '/login': () =>redirectIfAuthenticated(new LoginPage()),
  '/register': () =>redirectIfAuthenticated(new RegisterPage()),
};

export default routes;
