class Themes {
  constructor() {
    this.element = document.querySelector(".section_options.theme");
    this.toggle = document.querySelector("#dark_theme_toggle");
    this.dark_theme = false;

    this.waitSaveTimeout = null;

    this.toggle.onchange = () => {
      this.updateTheme();
    };
    this.updateTheme(false);
  }
  setup() {
    if (configurations.darkTheme) {
      this.toggle.checked = true;
      this.dark_theme = true;
    }
  }
  updateTheme(save = true) {
    if (this.toggle.checked) {
      this.dark_theme = true;
      document.querySelector(":root").setAttribute("data-theme-dark", "true");
    } else {
      this.dark_theme = false;
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
    configurations.darkTheme = this.dark_theme;

    configurations = await Storage.set("configurations", configurations);

    await MessageManager.send({
      type: "set",
      options: ["configurations_theme"],
      data: configurations,
    });
  }
}
