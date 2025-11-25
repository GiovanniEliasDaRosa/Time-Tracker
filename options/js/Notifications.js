class Notifications {
  constructor() {
    this.enabled = false;
    this.timeBetween = 0;
    this.showTopThree = false;

    this.waitSaveTimeout = "";
    this.waitUpdateTimeout = "";

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

    this.optionsElements.timeBetweenInput.onkeydown = (e) => {
      this.handleInputUpdate(e);
    };
    this.optionsElements.timeBetweenInput.onkeyup = (e) => {
      this.handleInputUpdate(e);
    };

    this.optionsElements.showTopThreeCheckbox.oninput = () => {
      this.showTopThree = this.optionsElements.showTopThreeCheckbox.checked;
      this.waitToSave();
    };

    this.handleUpdate(false);
  }

  handleInputUpdate(e) {
    let char_code = e.code;
    let any_key = char_code.match("Key|Digit|F|Arrow");

    if (char_code == "Backspace" || char_code == "Tab") {
      this.handleInputValidate();
      return;
    }

    if (any_key == null || (any_key[0] == "Key" && !e.ctrlKey)) {
      e.preventDefault();
      return;
    }

    let input_value = this.optionsElements.timeBetweenInput.value;
    if (input_value > 1440) {
      input_value = 1440;
      e.preventDefault();
    }
    this.optionsElements.timeBetweenInput.value = Number(input_value);

    this.handleInputValidate();

    if (input_value > 0) {
      this.timeBetween = Number(input_value);
      this.waitToSave();
    }
  }

  waitToSave() {
    clearInterval(this.waitSaveTimeout);

    this.waitSaveTimeout = setTimeout(() => {
      this.save();
    }, 500);
  }

  handleInputValidate() {
    if (this.optionsElements.timeBetweenInput.value == 0) {
      this.optionsElements.timeBetweenInput.classList.add("input_error");
    } else {
      this.optionsElements.timeBetweenInput.classList.remove("input_error");
    }
  }

  handleUpdate(animate = true) {
    clearTimeout(this.waitUpdateTimeout);
    this.element.style.transition = "none";
    this.element.classList.remove("expandable");
    this.element.style.height = "";
    this.moreOptionsElement.classList.remove("show_in");
    this.moreOptionsElement.classList.remove("show_out");

    let height_before = this.element.getBoundingClientRect().height;
    let height_after = 0;

    if (this.enabled) {
      this.moreOptionsElement.enable();

      if (!animate) return;

      height_after = this.element.getBoundingClientRect().height;
      this.moreOptionsElement.classList.add("show_in");
    } else {
      this.moreOptionsElement.disable();

      if (!animate) {
        this.moreOptionsElement.disable();
        return;
      }
      this.moreOptionsElement.classList.add("show_out");

      height_after = this.element.getBoundingClientRect().height;

      this.moreOptionsElement.enable();
    }

    this.element.style.height = `${height_before}px`;
    this.element.classList.add("expandable");

    this.waitUpdateTimeout = setTimeout(() => {
      this.element.style.height = `${height_after}px`;
      this.element.style.transition = "height 0.5s ease-out";

      this.waitUpdateTimeout = setTimeout(() => {
        if (!this.enabled) {
          this.moreOptionsElement.disable();
        }

        this.element.style.transition = "none";
        this.element.classList.remove("expandable");
        this.element.style.height = "";
        this.moreOptionsElement.classList.remove("show_in");
        this.moreOptionsElement.classList.remove("show_out");
      }, 500);
    }, 10);
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
