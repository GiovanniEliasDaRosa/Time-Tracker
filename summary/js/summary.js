// MARK: Summary
// let today = getDateInfo(new Date());
let today = null;
let tracking_time_local = null;
let tracked_time_history_local = null;

let update_filters_timeout = null;
let filter_open = null;

let template_timer_item_date = document.querySelector("#template_timer_item_date");
let template_timer_invalid = document.querySelector("#template_timer_invalid");
let template_timer_no_data = document.querySelector("#template_timer_no_data");
let template_timer_filter = document.querySelector("#template_timer_filter");

const timers = {
  day: new DailyManager(document.querySelector(".timer[data-type='day']")),
  week: new WeeklyManager(document.querySelector(".timer[data-type='week']")),
  month: new MonthlyManager(document.querySelector(".timer[data-type='month']")),
};

window.onresize = () => {
  clearTimeout(update_filters_timeout);
  updateFiltersPositions();

  update_filters_timeout = setTimeout(() => {
    updateFiltersPositions();
  }, 100);
};

function updateFiltersPositions() {
  timers.day.updateFilterPosition();
  timers.week.updateFilterPosition();
  timers.month.updateFilterPosition();
}

window.onclick = (e) => {
  let target = e.target;

  console.log(filter_open, target?.closest(".timer")?.dataset?.type);
  // Clicked outside the filter
  if (
    target.closest(".timer_item_filter") != null ||
    target.closest(".timer_item_button_filter") != null
  ) {
    if (filter_open != null && filter_open != target.closest(".timer").dataset.type) {
      timers[filter_open].closeFilter();
    }

    filter_open = target.closest(".timer").dataset.type;
  } else {
    console.log(filter_open);
    if (filter_open == null) return;

    timers[filter_open].closeFilter();
  }
};

let hash = window.location.hash.slice(1);

let tutorial = {
  active: false,
  class: null,
};

async function main() {
  let response = await MessageManager.send({
    type: "get",
    options: ["today_date", "tracking_time", "tracked_time_history"],
  });

  tracking_time_local = response.trackingTime;
  tracked_time_history_local = response.trackedTimeHistory;
  today = response.todayDate;

  for (const key in timers) {
    if (!Object.hasOwn(timers, key)) continue;

    let timer = timers[key];
    timer.startup();
    timer.dateInput.value = today.isoDate;
    timer.valid();
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

document.querySelector("#configurations_button").onclick = (e) => {
  handleExtensionTab("options/options.html", e);
};
