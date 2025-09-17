async function saveTrackedTime() {
  console.log("saveTrackedTime()");
  let date_save = Date.now();
  let session_domains = tabManager.sessionDomains;
  let total_increase = 0;

  tracking_time.domains.forEach((tracked_domain) => {
    session_domains.forEach((session_domain) => {
      if (tracked_domain.url == session_domain.url) {
        // If it's current tab that's tracking, make a fake stop to count ellapsedTime
        if (session_domain.startTime != null) {
          session_domain.ellapsedTime += date_save - session_domain.startTime;
          session_domain.startTime = date_save;
        }
      }
      let temp_calc = session_domain.ellapsedTime / 1000;
      // The saved time in storage, plus the needed to save
      total_increase += temp_calc;
      tracked_domain.time += temp_calc;
      session_domain.ellapsedTime = 0;
    });
  });

  tracking_time.totalTime += total_increase;

  console.log("____________");
  console.log(tracking_time);
  console.log(tracked_time_history);
  console.log("____________");

  await tabManager.updateTodaysData();

  timer_timeout = setTimeout(saveTrackedTime, 4000);
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
