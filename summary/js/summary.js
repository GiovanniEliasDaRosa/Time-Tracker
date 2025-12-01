// MARK: Summary
let today = getDateInfo(new Date());
let tracking_time_local = null;
let tracked_time_history_local = null;

let template_timer_item_date = document.querySelector("#template_timer_item_date");
let template_timer_invalid = document.querySelector("#template_timer_invalid");
let template_timer_no_data = document.querySelector("#template_timer_no_data");

const timers = {
  day: new TimerManager(document.querySelector(".timer[data-type='day']")),
  // week: new TimerManager(document.querySelector(".timer[data-type='week']")),
  // month: new TimerManager(document.querySelector(".timer[data-type='month']")),
};

let hash = window.location.hash.slice(1);

let tutorial = {
  active: false,
  class: null,
};

async function main() {
  let response = await MessageManager.send({
    type: "get",
    options: ["tracking_time", "tracked_time_history"],
  });

  tracking_time_local = response.trackingTime;
  tracked_time_history_local = response.trackedTimeHistory;

  for (const key in timers) {
    if (!Object.hasOwn(timers, key)) continue;

    let timer = timers[key];
    timer.dateInput.value = today.isoDate;
    timer.validate();
  }

  // Tutorial stuff
  let data_url = hash.match("(.*)=(.*)");
  if (data_url != null) {
    if (data_url[2] == "true" && data_url[1] == "show_tutorial") {
      tutorial.active = true;
      tutorial.class = new Tutorial();
    }
  }
}

main();

document.querySelector("#configurations_button").onclick = () => {
  handleExtensionTab("options/options.html", window);
};
