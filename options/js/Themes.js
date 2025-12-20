class Themes {
  constructor() {
    this.element = document.querySelector(".section_options.theme");
    this.toggle = document.querySelector("#dark_theme_toggle");
    this.darkTheme = false;

    this.waitSaveTimeout = null;

    this.toggle.onchange = () => {
      this.updateTheme();
    };
  }

  updateValue() {
    if (configurations.darkTheme) {
      this.toggle.checked = true;
      this.darkTheme = true;
    } else {
      this.toggle.checked = false;
      this.darkTheme = false;
    }

    this.updateTheme(false);
  }

  updateTheme(save = true) {
    if (this.toggle.checked) {
      this.darkTheme = true;
      document.querySelector(":root").setAttribute("data-theme-dark", "true");
    } else {
      this.darkTheme = false;
      document.querySelector(":root").setAttribute("data-theme-dark", "false");
    }

    if (save) {
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
