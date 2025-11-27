function getDateInfo(date) {
  // If passed a string as a date get the DATE prototype
  if (typeof date == "string") {
    date = new Date(`${date}T00:00`);
  }

  [month, day, year] = date.format().split("/").map(Number);
  [monthLong, weekday] = date.format({ weekday: "long", month: "long" }).split(" ");

  let temp_date = date;

  // Set to the nearest Thursday: current date + 4 - current day number
  temp_date.setDate(temp_date.getDate() + 4 - (temp_date.getDay() || 7));

  // Get the first day of the year, this year, month to 0, and day 1
  const yearStart = new Date(temp_date.getFullYear(), 0, 1);

  // Calculate the number of weeks, get the difference and divide by ms in a day (1000 * 60 * 60 * 24)
  // Adds one to ensure that the first day is in the 1° week, and divide by the weeks to find the week number
  const weekNumber = Math.ceil(((temp_date - yearStart) / 86400000 + 1) / 7);

  return {
    date: `${month.pad()}/${day.pad()}/${year}`,
    isoDate: `${year}-${month.pad()}-${day.pad()}`,
    weekday: weekday,
    day: day,
    month: month,
    monthLong: monthLong,
    year: year,
    weekNumber: weekNumber,
  };
}

async function handleExtensionTab(path, window_passed = null) {
  let url = browser.runtime.getURL(path);

  // Get all tabs
  let tabs = await browser.tabs.query({});
  // See if a summary tab is open
  summary_tab = tabs.filter((tab) => tab.url == url);

  // See if a summary tab is open
  if (summary_tab[0]) {
    // If it is, move to it
    await browser.tabs.update(summary_tab[0].id, {
      active: true,
      highlighted: true,
    });

    // Update the data
    await browser.tabs.reload(summary_tab[0].id);

    // Focuses the window to the one with the tab summary open
    await browser.windows.update(summary_tab[0].windowId, { focused: true });
  } else {
    // If it isn't, create a new tab
    browser.tabs.create({ url: url });
  }

  if (window_passed != null) {
    window_passed.close();
  }
}

function formatTime(time_in_seconds, options = {}) {
  let hours, minutes, seconds, time_string;
  hours = Math.floor(time_in_seconds / 3600);

  time_in_seconds -= hours * 3600;
  minutes = Math.floor(time_in_seconds / 60);

  hours = hours.pad();
  minutes = minutes.pad();

  if (options.seconds) {
    time_in_seconds -= minutes * 60;
    seconds = Math.floor(time_in_seconds);
    seconds = seconds.pad();
    time_string = `${hours}:${minutes}:${seconds}`;
  } else {
    time_string = `${hours}:${minutes}`;
  }

  return {
    hours: hours,
    minutes: minutes,
    seconds: seconds,
    timeString: time_string,
  };
}

Date.prototype.format = function (options, locale = "en-US") {
  return this.toLocaleDateString(locale, options);
};

String.prototype.pad = function (quantity = 2) {
  return this.padStart(quantity, "0");
};

Number.prototype.pad = function (quantity = 2) {
  return String(this).padStart(quantity, "0");
};

Element.prototype.cloneElement = function (selector) {
  return this.content.querySelector(selector).cloneNode(true);
};

Element.prototype.enable = function () {
  this.style.display = "";
  this.removeAttribute("disabled");
  this.removeAttribute("aria-disabled");
};

Element.prototype.disable = function (hide = true) {
  if (hide) {
    this.style.display = "none";
  }
  this.setAttribute("disabled", "true");
  this.setAttribute("aria-disabled", "true");
};

Date.prototype.normalize = function () {
  return new Date(this.getFullYear(), this.getMonth(), this.getDate());
};

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

Object.prototype.isEmpty = function () {
  for (const key in this) {
    if (Object.hasOwn(this, key)) {
      return false;
    }
  }

  return true;
};

const ms_per_day = 24 * 60 * 60 * 1000;
function compareDates(first, second, check_days_passed = false) {
  const first_date = new Date(first.isoDate).normalize().getTime();
  const second_date = new Date(second.isoDate).normalize().getTime();
  let difference = Math.round((first_date - second_date) / ms_per_day);

  // If the caller just want the difference for any reason
  if (!check_days_passed) {
    return { difference: difference };
  }

  // So the caller wants the diffence of the dates
  let result = {
    difference: difference,
    dayDifference: "",
  };

  if (difference < -7 || difference > 0) {
    result.dayDifference = "";
  } else if (difference == 0) {
    result.dayDifference = "Today";
  } else if (difference == -1) {
    result.dayDifference = "Yesterday";
  } else {
    // Between -7 and -2
    result.dayDifference = `Last ${first.weekday}`;
  }

  return result;
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showNotification() {
  let message = "";

  let tracking_domains = Array.from(tracking_time.domains);

  tracking_domains.sort((a, b) => {
    return a.time < b.time;
  });

  console.log(configurations.notifications.showTopThree);
  if (configurations.notifications.showTopThree) {
    for (let i = 0; i < 3; i++) {
      const domain = tracking_domains[i];
      if (domain == null) continue;
      message += `${formatTime(domain.time).timeString} ${domain.url}\n`;
    }
  }

  browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("img/icon.png"),
    title: `Time Tracker ${formatTime(tracking_time.totalTime).timeString}`,
    message: message,
  });
}

// Handle notification clicks
browser.notifications.onClicked.addListener((notificationId) => {
  console.log(`User clicked on notification ${notificationId}.`);
  handleExtensionTab("summary/summary.html");
});
