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
}

main();

document.querySelector("#configurations_button").onclick = () => {
  handleExtensionTab("options/options.html", window);
};
