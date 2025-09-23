async function saveTrackedTime() {
  console.log("saveTrackedTime()");
  let total_increase = 0;

  for (let i = 0; i < tracking_time.domains.length; i++) {
    const tracked_domain = tracking_time.domains[i];
    const session_domain = tabManager.sessionDomains[i];

    // The currently open tab didn't finish tracking,
    // so we fake it like they just stop, and count the ellapsed time
    if (session_domain.startTime != null) {
      let date_save = Date.now();
      session_domain.ellapsedTime += date_save - session_domain.startTime;
      session_domain.startTime = date_save;
    }

    // Set the value in seconds, and reset the ellapsedTtime
    let temp_calc = session_domain.ellapsedTime / 1000;
    session_domain.ellapsedTime = 0;

    // The saved time in storage, plus the needed to save
    total_increase += temp_calc;
    tracked_domain.time += temp_calc;
  }

  tracking_time.totalTime += total_increase;

  console.log("____________");
  console.log(tracking_time);
  console.log(tracked_time_history);
  console.log("____________");

  await tabManager.updateTodaysData();

  timer_timeout = setTimeout(saveTrackedTime, 60000);
}

browser.windows.onFocusChanged.addListener(onFocusChanged);

async function onFocusChanged(windowId) {
  let this_window = await browser.windows.getCurrent();
  // Window regained focus
  if (windowId == this_window.id) {
    // Start tracking time
    tabManager.startTraker();
  } else {
    tabManager.stopTraker();
  }
}

// On closing current window, save data
browser.windows.onRemoved.addListener((windowId) => {
  // Remove the timer, to prevent running multiple times function that saves the tracked time
  clearTimeout(timer_timeout);
  // Save the data
  saveTrackedTime();
});

