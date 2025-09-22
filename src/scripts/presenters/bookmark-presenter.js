export default class BookmarkPresenter {
  #view;
  #storyModel;

  constructor({storyModel, view}) {
    this.#storyModel = storyModel;
    this.#view = view;
  }

  async loadBookmarkedStories() {
    const result = await this.#storyModel.loadBookmarkedStories();
    
    if (result.success) {
        this.#view.showBookmarkedStories(result.stories);
        if (result.stories.length === 0) {
            this.#view.showEmptyState();
        }
    }
  }

  async toggleBookmark(story) {
    const isBookmarked = await this.#storyModel.isStoryBookmarked(story.id);
    
    if (isBookmarked) {
        const result = await this.#storyModel.removeBookmark(story.id);
        if (result.success) {
            this.#view.updateBookmarkButton(story.id, false);
            this.#view.showMessage(result.message, 'info');
        }
    } else {
        const result = await this.#storyModel.bookmarkStory(story);
        if (result.success) {
            this.#view.updateBookmarkButton(story.id, true);
            this.#view.showMessage(result.message, 'success');
        }
    }
  }
}