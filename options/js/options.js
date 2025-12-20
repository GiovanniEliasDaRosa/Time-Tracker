let configurations = null;

// Summary handler
document.querySelector("#summary_button").onclick = () => {
  handleExtensionTab("summary/summary.html", window);
};

// * MARK: Create options
// Notification
let notifications = new Notifications();

// Tutorial
document.querySelector("#tutorial_start").onclick = () => {
  handleExtensionTab("summary/summary.html#show_tutorial=true", window);
};

// New Day
let new_day = new NewDay();

// Themes
let themes = new Themes();

// Data
let data_manager = new DataManager();

let animate_update_config_interval = null;
let animate_update_config_single_timeout = null;

// * MARK: Setup options
async function main() {
  configurations = await Storage.get("configurations");

  notifications.setup().updateValue();
  new_day.updateValue();
  themes.updateValue();
  data_manager.setup();
}

async function updatedConfigurations(options_passed = {}) {
  let options = {
    animate: options_passed.animate ?? false,
  };

  configurations = await Storage.get("configurations");

  // If don't want to animate
  if (!options.animate) {
    notifications.updateValue();
    new_day.updateValue();
    themes.updateValue();
    return;
  }

  // Want to animate

  clearInterval(animate_update_config_interval);
  clearTimeout(animate_update_config_single_timeout);

  let options_possible = [notifications, new_day, themes];

  // Scroll to the first with smooth so the user don't get confused where they are
  options_possible[0].element.scrollIntoView({ behavior: "smooth", block: "center" });

  let i = 0;

  animate_update_config_interval = setInterval(() => {
    const current_option = options_possible[i];
    i++;

    // Gone thourgh all steps
    if (i > options_possible.length) {
      data_manager.element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Prevent this cotinue running every 1.2 seconds
      clearInterval(animate_update_config_interval);
      return;
    }

    current_option.element.setAttribute("data-changed-configuration", "true");
    current_option.element.scrollIntoView({ behavior: "instant", block: "center" });

    current_option.updateValue({ animate: true });

    animate_update_config_single_timeout = setTimeout(() => {
      current_option.element.removeAttribute("data-changed-configuration");
    }, 400);
  }, 500);
}

main();
