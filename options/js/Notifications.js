class Notifications {
  constructor() {
    this.enabled = false;
    this.timeBetween = 0;
    this.showTopThree = false;

    this.waitSaveTimeout = "";
    this.waitUpdateTimeouts = {
      main: undefined,
      nested: undefined,
    };

    this.element = document.querySelector(".section_options.notifications");

    this.moreOptionsElement = this.element.querySelector(".notifications_more_options");
    this.optionsElements = {
      toggleEnableCheckbox: this.element.querySelector("#notifications_enable_checkbox"),
      timeBetweenInput: this.element.querySelector("#notifications_content_frequency"),
      showTopThreeCheckbox: this.element.querySelector("#notifications_content_checkbox"),
    };
  }
  setup() {
    if (configurations == null) {
      console.error("No config setup");
      return;
    }
    let notifications = configurations.notifications;

    this.enabled = notifications.enabled ?? false;
    this.timeBetween = notifications.timeBetween ?? 0;
    this.showTopThree = notifications.showTopThree ?? false;

    this.optionsElements.toggleEnableCheckbox.checked = this.enabled;
    this.optionsElements.timeBetweenInput.value = this.timeBetween;
    this.optionsElements.showTopThreeCheckbox.checked = this.showTopThree;

    this.optionsElements.toggleEnableCheckbox.oninput = () => {
      this.enabled = this.optionsElements.toggleEnableCheckbox.checked;
      this.handleUpdate();
      this.waitToSave();
    };

    this.optionsElements.timeBetweenInput.onbeforeinput = (e) => {
      Validator.number(this.optionsElements.timeBetweenInput, e);
    };

    this.optionsElements.timeBetweenInput.oninput = (e) => {
      this.handleInputUpdate(e);
    };

    this.optionsElements.showTopThreeCheckbox.oninput = () => {
      this.showTopThree = this.optionsElements.showTopThreeCheckbox.checked;
      this.waitToSave();
    };

    this.handleUpdate(false);
  }

  handleInputUpdate(e) {
    Validator.number(this.optionsElements.timeBetweenInput, e);
    let valid_value = Validator.validate(this.optionsElements.timeBetweenInput, 1, 1440);

    // If has the result value has changed and needs to be saved
    if (valid_value) {
      this.timeBetween = Number(this.optionsElements.timeBetweenInput.value);
      this.waitToSave();
    }
  }

  waitToSave() {
    clearInterval(this.waitSaveTimeout);

    this.waitSaveTimeout = setTimeout(() => {
      this.save();
    }, 500);
  }

  handleUpdate(animate = true) {
    this.waitUpdateTimeouts = animatorAnimate({
      parent: this.element,
      more: this.moreOptionsElement,
      enabled: this.enabled,
      timeout: this.waitUpdateTimeouts,
      animate: animate,
    });
  }

  async save() {
    configurations.notifications = {
      enabled: this.enabled,
      timeBetween: this.timeBetween,
      showTopThree: this.showTopThree,
    };

    configurations = await Storage.set("configurations", configurations);

    await MessageManager.send({
      type: "set",
      options: ["configurations_notification"],
      data: configurations,
    });
  }
}
