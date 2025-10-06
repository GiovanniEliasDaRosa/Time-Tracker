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

function handleResponse(message) {
  if (!message || !message.isOk) {
    console.error("Message is not ok", message);
    return;
  }
  tracking_time_local = message.trackingTime;
  tracked_time_history_local = message.allData;

  for (const key in timers) {
    let timer = timers[key];
    timer.dateInput.value = today.isoDate;
    timer.validate();
  }
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

browser.runtime
  .sendMessage({ type: "calculate_time", with: "all_data" })
  .then(handleResponse, handleError);
