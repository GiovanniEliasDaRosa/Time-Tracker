let timer_current_value_element = document.querySelector(".timer_current_value");
let timer_total_value_element = document.querySelector(".timer_total_value");

let timer_progress_element = document.querySelector(".timer_progress");
let timer_progress_text_element = timer_progress_element.querySelector(".timer_progress_text");
let timer_progress_bar_fill_element = timer_progress_element.querySelector(
  ".timer_progress_bar_fill"
);

async function get_timer() {
  let response = await MessageManager.send({ type: "calculate_time", with: "current_tab" });

  let tracking_time_local = response.trackingTime;
  let current_tab = response.currentTab;

  let current_tab_time = 0;
  let percent = 0;

  // If the curent tab is a valid URL
  if (current_tab.url != null) {
    let current_tab_index = tracking_time_local.domains.findIndex(
      (domain) => domain.url == current_tab.url
    );
    current_tab_time = tracking_time_local.domains[current_tab_index].time;
  }

  // Has time tracking_time_local to calculate. Necessary, because 0/0 gets a NaN
  if (tracking_time_local.totalTime != 0) {
    percent = (current_tab_time / tracking_time_local.totalTime) * 100;
  }

  timer_progress_text_element.innerText = `${Math.round(percent)}%`;
  timer_progress_bar_fill_element.style.setProperty("translate", `${percent - 100}%`);

  timer_current_value_element.innerText = formatTime(current_tab_time).timeString;
  timer_total_value_element.innerText = formatTime(tracking_time_local.totalTime).timeString;
}

get_timer();

document.querySelector("#timer_button").onclick = (e) => {
  handleExtensionTab("summary/summary.html", window);
};
