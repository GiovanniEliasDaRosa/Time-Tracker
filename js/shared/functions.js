// MARK: Dates
function getDateInfo(date, time = "00:00") {
  // If passed a string as a date get the DATE prototype
  if (typeof date == "string") {
    date = new Date(`${date} ${time}`);
  }

  [month, day, year] = date.format().split("/").map(Number);
  [monthLong, weekday] = date.format({ weekday: "long", month: "long" }).split(" ");

  let temp_date = new Date(date.getTime());

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

Date.prototype.format = function (options, locale = "en-US") {
  return this.toLocaleDateString(locale, options);
};

// MARK: Helper functions
async function handleExtensionTab(path, event = null, close_current_tab = true) {
  let url = browser.runtime.getURL(path);

  // If have an event, see if it has crtl key pressed
  if (event != null) {
    // If the ctrl is pressed we don't want to close the current tab
    let ctrl_pressed = event.ctrlKey || event.metaKey;
    close_current_tab = !ctrl_pressed;
  }

  // Get the current tab
  let curret_tab = await browser.tabs.query({ active: true });

  // Get all tabs
  let tabs = await browser.tabs.query({});
  // See if a summary tab is open
  summary_tab = tabs.filter((tab) => tab.url.replace(/#(.+)?/, "") == url.replace(/#(.+)?/, ""));

  // See if a summary tab is open
  if (summary_tab[0]) {
    // If it is, move to it
    await browser.tabs.update(summary_tab[0].id, {
      url: url,
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

  if (close_current_tab) {
    // Close it
    await browser.tabs.remove(curret_tab[0].id);
  }
}

// MARK: Notifications
function showNotification() {
  let message = "";

  let tracking_domains = Array.from(tracking_time.domains);

  tracking_domains.sort((a, b) => {
    return a.time < b.time;
  });

  if (configurations.notifications.showTopThree) {
    for (let i = 0; i < 3; i++) {
      const domain = tracking_domains[i];
      if (domain == null) continue;
      message += `${formatTime(domain.time).timeString} ${domain.url}\n`;
    }
  }

  browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("img/icons/icon.png"),
    iconUrl: browser.runtime.getURL("assets/icons/icon.png"),
    title: `Time Tracker ${formatTime(tracking_time.totalTime).timeString}`,
    message: message,
  });
}

// On notification clicked
browser.notifications.onClicked.addListener((notificationId) => {
  handleExtensionTab("summary/summary.html");
});

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// MARK: Animator
function animatorAnimate(options) {
  let parent = options.parent;
  let more = options.more;
  let enabled = options.enabled;
  let timeout = options.timeout;
  let animate = options.animate ?? true;

  if (parent == null || more == null || enabled == null || timeout == null) {
    console.error("Animator has an variable with an empty element associated with it", options);
    return;
  }

  clearTimeout(timeout.main);
  clearTimeout(timeout.nested);

  parent.style.transition = "none";
  parent.classList.remove("animator_expandable");
  parent.style.height = "";
  more.classList.remove("animator_show_in");
  more.classList.remove("animator_show_out");

  let height_before = parent.getBoundingClientRect().height;
  let height_after = 0;

  if (enabled) {
    more.enable();

    if (!animate) {
      return timeout;
    }

    height_after = parent.getBoundingClientRect().height;
    more.classList.add("animator_show_in");
  } else {
    more.disable();

    if (!animate) {
      more.disable();
      return timeout;
    }
    more.classList.add("animator_show_out");

    height_after = parent.getBoundingClientRect().height;

    more.enable();
  }

  parent.style.height = `${height_before}px`;
  parent.classList.add("animator_expandable");

  timeout.main = setTimeout(() => {
    parent.style.height = `${height_after}px`;
    parent.style.transition = "height 0.5s ease-out";

    timeout.nested = setTimeout(() => {
      if (!enabled) {
        more.disable();
      }

      parent.style.transition = "none";
      parent.classList.remove("animator_expandable");
      parent.style.height = "";
      more.classList.remove("animator_show_in");
      more.classList.remove("animator_show_out");
    }, 500);
  }, 10);

  return timeout;
}

// MARK: Prototypes
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
  this.removeAttribute("data-disabled-effect");
};

Element.prototype.disable = function (options_passed = {}) {
  let options = {
    hide: options_passed.hide ?? true,
    lookDisabled: options_passed.lookDisabled ?? true,
  };

  // If want to hide the element
  if (options.hide) {
    this.style.display = "none";
  }

  this.setAttribute("disabled", "true");
  this.setAttribute("aria-disabled", "true");

  // If don't want to show that it's disabled
  if (!options.lookDisabled) {
    this.setAttribute("data-disabled-effect", "true");
  }
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

// As this JS file is necessary for the pages, this is where the code can be placed and remove unecessary repeating
async function loadTheme() {
  let load = await browser.storage.local.get("configurations");

  // Has config, and is dark theme
  if (!load.isEmpty() && load.configurations.darkTheme) {
    document.querySelector(":root").setAttribute("data-theme-dark", "true");
  } else {
    document.querySelector(":root").setAttribute("data-theme-dark", "false");
  }
}

loadTheme();
