async function trackTime() {
  console.log("trackTime()");

  tracking_time.domains[tabManager.domainIndex].time += 2;
  tracking_time.totalTime += 2;

  console.log("____________");
  console.log(tracking_time);
  console.log(tracked_time_history);
  console.log("____________");

  await tabManager.updateTodaysData();
}
