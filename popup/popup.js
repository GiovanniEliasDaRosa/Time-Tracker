let timer_current_value_element = document.querySelector(".timer_current_value");
let timer_total_value_element = document.querySelector(".timer_total_value");

let timer_progress_element = document.querySelector(".timer_progress");
let timer_progress_text_element = timer_progress_element.querySelector(".timer_progress_text");
let timer_progress_bar_fill_element = timer_progress_element.querySelector(
  ".timer_progress_bar_fill"
);

let tracking_time_local = [];
let current_tab = null;

function get_timer() {
  let saved = tracking_time_local;

  let current_tab_time = 0;
  let percent = 0;

  // If the curent tab is a valid URL
  if (current_tab != null) {
    let current_tab_index = saved.domains.findIndex((domain) => domain.url == current_tab.url);
    current_tab_time = saved.domains[current_tab_index].time;
  }

  // Has time saved to calculate. Necessary, because 0/0 gets a NaN
  if (saved.totalTime != 0) {
    percent = (current_tab_time / saved.totalTime) * 100;
  }

  timer_progress_text_element.innerText = `${Math.round(percent)}%`;
  timer_progress_bar_fill_element.style.setProperty("translate", `${percent - 100}%`);

  timer_current_value_element.innerText = formatTime(current_tab_time).timeString;
  timer_total_value_element.innerText = formatTime(saved.totalTime).timeString;
}

function handleResponse(message) {
  if (!message || !message.isOk) {
    console.error("Message is not ok", message);
    return;
  }
  tracking_time_local = message.tracking_time;
  current_tab = message.current_tab;

  get_timer();
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

browser.runtime
  .sendMessage({ type: "calculate_time", with: "current_tab" })
  .then(handleResponse, handleError);
