class Themes {
  constructor() {
    this.element = document.querySelector(".section_options.theme");
    this.toggle = document.querySelector("#dark_theme_toggle");
    this.darkTheme = false;

    this.waitSaveTimeout = null;
    this.transitionThemeTimeout = null;

    this.toggle.onchange = () => {
      this.updateTheme();
    };
  }

  updateValue(options_passed = {}) {
    let options = {
      animate: options_passed.animate ?? true,
      save: options_passed.save ?? true,
    };

    if (configurations.darkTheme) {
      this.toggle.checked = true;
      this.darkTheme = true;
    } else {
      this.toggle.checked = false;
      this.darkTheme = false;
    }

    this.updateTheme(options);
  }

  updateTheme(options_passed = {}) {
    let options = {
      animate: options_passed.animate ?? true,
      save: options_passed.save ?? true,
    };

    let root = document.querySelector(":root");
    if (this.toggle.checked) {
      this.darkTheme = true;
      root.setAttribute("data-theme-dark", "true");
    } else {
      this.darkTheme = false;
      root.setAttribute("data-theme-dark", "false");
    }

    if (options.animate) {
      clearTimeout(this.transitionThemeTimeout);

      let root = document.querySelector(":root");
      root.setAttribute("data-theme-transition", "true");

      this.transitionThemeTimeout = setTimeout(() => {
        root.removeAttribute("data-theme-transition");
      }, 1000);
    }

    if (options.save) {
      this.waitToSave();
    }
  }

  waitToSave() {
    clearInterval(this.waitSaveTimeout);

    this.waitSaveTimeout = setTimeout(() => {
      this.save();
    }, 500);
  }

  async save() {
    configurations.darkTheme = this.darkTheme;

    configurations = await Storage.set("configurations", configurations);

    await MessageManager.send({
      type: "set",
      options: ["configurations_theme"],
      data: configurations,
    });
  }
}
