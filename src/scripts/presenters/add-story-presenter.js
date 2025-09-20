export default class AddStoryPresenter {

    #view
    #storyModel
  
    constructor({storyModel, view}) {
      this.#storyModel = storyModel;
      this.#view = view;
    }
  
    // Form submission
    async handleFormSubmit({description, photo, lat, lon}) {
      try {
        await this.#storyModel.createStory({description, photo, lat, lon});
        this.#view.showSuccessMessage('Story added successfully');
        this.#view.resetForm();
      } catch (error) {
        this.#view.showErrorMessage(error.message);
      }
    }
}
