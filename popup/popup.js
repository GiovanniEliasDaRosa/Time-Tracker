// Time
let summary_button = document.querySelector("#summary_button");
let summary_button_time = document.querySelector(".summary_button_time");
let summary_button_time_current = summary_button.querySelector(".summary_button_time_current");
let summary_button_time_total = summary_button.querySelector(".summary_button_time_total");

// Progress bar
let summary_button_progress = summary_button.querySelector(".summary_button_progress");
let summary_button_progress_text = summary_button.querySelector(".summary_button_progress_text");
let summary_button_progress_text_span = summary_button.querySelector(
  ".summary_button_progress_text > span"
);

// Rectangular progress bar
let summary_button_progress_bar_rectangular = summary_button.querySelector(
  ".summary_button_progress_bar_rectangular"
);
let summary_button_progress_bar_rectangular_fill = summary_button.querySelector(
  ".summary_button_progress_bar_rectangular_fill"
);

// Circular progress bar
let summary_button_progress_bar_circular = summary_button.querySelector(
  ".summary_button_progress_bar_circular"
);
let summary_button_progress_bar_circular_svg_fill = summary_button.querySelector(
  ".summary_button_progress_bar_circular_svg_fill"
);

async function update_timer() {
  let response = await MessageManager.send({
    type: "get",
    options: ["tracking_time", "current_tab"],
  });

  let tracking_time_local = response.trackingTime;
  let current_tab = response.currentTab;

  let current_tab_time = 0;
  let percent = 0;
  let progress = 0;

  // If the curent tab is a valid URL
  if (current_tab.url != null) {
    let current_tab_index = tracking_time_local.domains.findIndex(
      (domain) => domain.url == current_tab.url
    );
    current_tab_time = tracking_time_local.domains[current_tab_index].time;
  }

  // Has time tracking_time_local to calculate. Necessary, because 0/0 gets a NaN
  if (tracking_time_local.totalTime != 0) {
    percent = current_tab_time / tracking_time_local.totalTime;
    progress = percent * 100;
  }

  summary_button_progress_text_span.innerText = `${Math.round(progress)}%`;
  summary_button_progress.style.setProperty("--percent", percent);
  summary_button_progress.style.setProperty("--progress", `${progress}%`);

  summary_button_time_current.innerText = formatTime(current_tab_time).timeString;
  summary_button_time_total.innerText = formatTime(tracking_time_local.totalTime).timeString;

  let progress_is_rectangle = true;
  if (progress_is_rectangle) {
    summary_button_progress_bar_rectangular.enable();
    summary_button_progress_bar_circular.disable();
  } else {
    summary_button_progress_bar_rectangular.disable();
    summary_button_progress_bar_circular.enable();

    let angle = percent * 360 - 90;
    summary_button_progress_text.style.setProperty("--angle-outer", `${angle}deg`);
    summary_button_progress_text.style.setProperty("--angle-inner", `${360 - angle}deg`);
  }
}

update_timer();

summary_button.onclick = async () => {
  await handleExtensionTab("summary/summary.html", null, false);
  window.close();
};

document.querySelector("#configurations_button").onclick = async () => {
  await handleExtensionTab("options/options.html", null, false);
  window.close();
};
