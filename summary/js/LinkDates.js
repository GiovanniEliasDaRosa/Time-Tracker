class LinkDates {
  constructor() {
    this.active = false;
    this.button = document.querySelector("#link_dates_button");

    this.infoShown = false;
    this.infoPopup = document.querySelector("#link_dates_info_popup");

    // When clicking to link or unlick dates
    this.button.onclick = () => {
      this.updateLinkDates();
    };

    this.button.onmouseover = () => this.updateLinkDatesPopup();
    this.button.onmouseout = () => this.updateLinkDatesPopup(true);

    this.button.onfocus = () => {
      if (this.infoShown) return;
      this.updateLinkDatesPopup();
    };
    this.button.onblur = () => this.updateLinkDatesPopup(true);
  }

  async startup() {
    // Try load config
    let loaded_link = await Storage.get("linkedDates");

    // If has a config, and it is to link
    if (loaded_link != null && loaded_link == true) {
      this.updateLinkDates(false);
    }
  }

  async updateLinkDates(save = true) {
    if (this.active) {
      // Deactivate now
      this.button.classList.remove("link");
      this.button.classList.add("link_slash");

      this.active = false;
    } else {
      // Activate now
      this.button.classList.remove("link_slash");
      this.button.classList.add("link");

      this.active = true;
    }

    this.button.setAttribute("data-enabled", this.active);

    if (save) {
      await Storage.set("linkedDates", this.active);
    }
  }

  handleUpdateDates(options_passed = {}) {
    // If linked dates is deactivaed do nothing
    if (!this.active) return;

    let options = {
      type: options_passed.type ?? null,
      date: options_passed.date ?? null,
    };

    // If one of the two is empty stop here
    if (options.type == null || options.date == null) return;

    let other_timers = Object.fromEntries(
      Object.entries(timers).filter(([key]) => {
        return key != options.type;
      }),
    );

    for (const key in other_timers) {
      if (!Object.hasOwn(other_timers, key)) continue;

      const timer = other_timers[key];
      timer.dateInput.value = options.date;
      timer.valid({ fromLink: true });
    }
  }

  updateLinkDatesPopup(force_hide = false) {
    if (this.infoShown || force_hide) {
      // Hide now
      this.infoPopup.disable();
      this.infoShown = false;
      this.button.setAttribute("aria-pressed", "false");
    } else {
      // Show now
      this.infoPopup.enable();
      this.infoShown = true;

      this.updateInfoPosition();
      this.button.setAttribute("aria-pressed", "true");
    }
  }

  updateInfoPosition() {
    // If its hidden stop the code here
    if (!this.infoShown) return;

    let bound_button = this.button.getBoundingClientRect();
    let bound_popup = this.infoPopup.getBoundingClientRect();

    let horizontal_align = bound_button.left + bound_button.width / 2 - bound_popup.width / 2;
    let vertical_align = bound_button.top + bound_button.height + window.scrollY;

    if (horizontal_align + bound_popup.width > window.innerWidth - 2 * font_size) {
      // Try to position most to the center possible but not cut off with a threashold
      let overpassed_value =
        horizontal_align + bound_popup.width - window.innerWidth + 2 * font_size;

      horizontal_align -= overpassed_value;
    }

    if (horizontal_align <= 1 * font_size) {
      // If has left less than 2rem
      horizontal_align = 1 * font_size;
    }

    this.infoPopup.style.left = `${horizontal_align}px`;
    this.infoPopup.style.top = `${vertical_align}px`;
  }
}
