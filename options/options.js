let configurations = null;
let notifications = new Notifications();

async function main() {
  configurations = await Storage.get("configurations");
  notifications.setup();
}

main();

// Summary handler
document.querySelector("#summary_button").onclick = () => {
  handleExtensionTab("summary/summary.html", window);
};

// Tutorial handler
document.querySelector("#tutorial_start").onclick = () => {
  handleExtensionTab("summary/summary.html#show_tutorial=true", window);
};
