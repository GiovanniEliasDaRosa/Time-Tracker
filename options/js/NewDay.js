class NewDay {
  constructor() {
    this.element = document.querySelector(".section_options.new_day");
    this.fontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);

    this.hoursSide = "";
    this.hoursSelected = 0;

    this.slider = this.element.querySelector(".slider_options_slider");
    this.range = this.element.querySelector("#slider_options_slider_range");
    this.labels = Array.from(this.element.querySelector(".slider_options_slider_labels").children);
    this.current = this.element.querySelector(".slider_options_slider_current");

    // Get the dataset orders elements to the correct key
    this.labelsOrders = {
      0: [],
      1: [],
      2: [],
    };

    this.labels.forEach((label) => {
      this.labelsOrders[label.dataset.order].push(label);
    });

    this.waitSaveTimeout = "";
    this.newDaySliderTimeout = "";

    this.waitUpdateTimeouts = {
      main: undefined,
      nested: undefined,
    };

    this.inputManually = this.element.querySelector("#input_manually");
    this.optionsMore = this.element.querySelector(".section_options_more");
    this.inputHours = this.element.querySelector("#new_day_input_hours");

    this.optionsMore.disable();

    this.range.oninput = () => {
      this.handleInputUpdate("slider");
    };

    this.inputManually.oninput = () => {
      this.handleInputManuallyUpdate();
    };

    this.inputHours.onbeforeinput = (e) => {
      Validator.number(this.inputHours, e, { negative: true });
    };

    this.inputHours.oninput = (e) => {
      this.handleInputHoursChange(e);
    };

    window.onresize = () => {
      this.fontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
      this.newDayUpdate();
    };

    this.range.value = this.hoursSelected;
    this.inputHours.value = this.hoursSelected;
    this.newDayUpdate();
  }

  setup() {
    this.hoursSelected = configurations.newDayStart.hour;

    let hour_temp = ((configurations.newDayStart.hour % 24) + 24) % 24;
    let hour = hour_temp <= 12 ? hour_temp : hour_temp - 24;

    // Visually if the user saved with the slider on the left
    if (hour == 12 && configurations.newDayStart.side == "left") {
      hour = hour - 24;
    }

    this.range.value = hour;
    this.handleInputUpdate("slider", { tooltip: false });
  }

  handleInputUpdate(from, options_passed = {}) {
    let options = {
      tooltip: options_passed.tooltip ?? true,
    };

    clearTimeout(this.newDaySliderTimeout);
    this.current.enable();

    if (from == "number") {
      this.range.value = this.inputHours.value;
    } else {
      this.inputHours.value = this.range.value;
    }

    let hour = Number(this.range.value);

    // Position the element
    let side = hour / 12;
    let percentage = ((hour + 12) / 24) * 100;

    this.current.style.setProperty("--side", side);
    this.current.style.setProperty("--percentage", `${percentage}%`);

    // Format hours
    let formatted = {
      hour24: null,
      hour12: null,
    };

    // Will wrap hours that are more than 24 and give the correct 24 hours time
    let hour24 = (hour + 24) % 24;
    formatted.hour24 = hour24.pad(2);

    // Will like wrap the hours into a 12 format
    // This handles rollovers like (13 -> 1, 23 -> 11)
    let hour12 = ((hour24 + 11) % 12) + 1;
    let amPm = hour24 >= 12 ? "PM" : "AM";
    formatted.hour12 = hour12.pad(2) + amPm;

    if (options.tooltip) {
      this.current.innerHTML = `${formatted.hour12}<br>${formatted.hour24}:00`;

      // Add delay to transition have animation in appeararing
      this.newDaySliderTimeout = setTimeout(() => {
        this.current.classList.add("show");
      }, 0);

      // Wait some seconds for the user have time to see it
      this.newDaySliderTimeout = setTimeout(() => {
        // Animate out
        this.current.classList.remove("show");

        this.newDaySliderTimeout = setTimeout(() => {
          this.current.disable();
        }, 250);
      }, 15000);
    }

    // If has a result value to be changed
    this.hoursSide = hour == -12 ? "left" : "";
    this.hoursSelected = Number(formatted.hour24);
    this.waitToSave();
  }

  handleInputManuallyUpdate(animate = true) {
    this.waitUpdateTimeouts = animatorAnimate({
      parent: this.element,
      more: this.optionsMore,
      enabled: this.inputManually.checked,
      timeout: this.waitUpdateTimeouts,
      animate: animate,
    });
  }

  handleInputHoursChange(e) {
    Validator.number(this.inputHours, e, { negative: true });
    let valid_value = Validator.validate(this.inputHours, -12, 12);

    if (valid_value) {
      this.handleInputUpdate("number");
    }
  }

  waitToSave() {
    clearInterval(this.waitSaveTimeout);

    this.waitSaveTimeout = setTimeout(() => {
      this.save();
    }, 500);
  }

  async save() {
    configurations.newDayStart = {
      hour: this.hoursSelected,
      side: this.hoursSide,
    };

    configurations = await Storage.set("configurations", configurations);

    await MessageManager.send({
      type: "set",
      options: ["configurations_new_day_start"],
      data: configurations,
    });
  }

  newDayUpdate() {
    if (window.innerWidth > this.fontSize * 50) {
      this.labelsOrders[2].forEach((label) => {
        label.enable();
      });
    } else {
      this.labelsOrders[2].forEach((label) => {
        label.disable();
      });
    }

    if (window.innerWidth > this.fontSize * 27) {
      this.labelsOrders[1].forEach((label) => {
        label.enable();
      });
    } else {
      this.labelsOrders[1].forEach((label) => {
        label.disable();
      });
    }
  }
}
