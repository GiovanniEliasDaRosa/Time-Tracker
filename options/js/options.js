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

// * MARK: Setup options
async function main() {
  configurations = await Storage.get("configurations");

  notifications.setup();
  new_day.setup();
  themes.setup();
  data_manager.setup();
}

main();
