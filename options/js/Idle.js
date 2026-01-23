class Idle {
  constructor() {
    this.enabled = false;
    this.detectionInterval = 0;

    this.waitSaveTimeout = "";
    this.waitUpdateTimeouts = {
      main: undefined,
      nested: undefined,
    };

    this.element = document.querySelector(".section_options.idle");

    this.moreOptionsElement = this.element.querySelector(".idle_more_options");
    this.optionsElements = {
      toggleEnableCheckbox: this.element.querySelector("#idle_enable_checkbox"),
      detectionInterval: this.element.querySelector("#idle_content_detection_interval"),
    };
  }

  setup() {
    this.optionsElements.toggleEnableCheckbox.oninput = () => {
      this.enabled = this.optionsElements.toggleEnableCheckbox.checked;
      this.handleUpdate();
      this.waitToSave();
    };

    this.optionsElements.detectionInterval.onbeforeinput = (e) => {
      Validator.number(this.optionsElements.detectionInterval, e, {
        min: 15,
        max: Infinity,
      });
    };

    this.optionsElements.detectionInterval.oninput = (e) => {
      this.handleInputUpdate(e);
    };

    return this;
  }

  updateValue(options_passed = {}) {
    let options = {
      animate: options_passed.animate ?? false,
      save: options_passed.save ?? true,
    };

    let notifications = configurations.idle;

    this.enabled = notifications.active ?? false;
    this.detectionInterval = notifications.interval ?? 60;

    this.optionsElements.toggleEnableCheckbox.checked = this.enabled;
    this.optionsElements.detectionInterval.value = this.detectionInterval;

    Validator.validate(this.optionsElements.detectionInterval, 15, Infinity);

    this.handleUpdate(options.animate);
  }

  handleInputUpdate(e) {
    let valid_value = Validator.number(this.optionsElements.detectionInterval, e, {
      min: 15,
      max: Infinity,
    });

    // If has the result value has changed and needs to be saved
    if (valid_value) {
      this.detectionInterval = Number(this.optionsElements.detectionInterval.value);
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
    configurations.idle = {
      active: this.enabled,
      interval: this.detectionInterval,
    };

    configurations = await Storage.set("configurations", configurations);

    await MessageManager.send({
      type: "set",
      options: ["configurations_idle"],
      data: configurations,
    });
  }
}
