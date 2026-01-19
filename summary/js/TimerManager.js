class TimerManager {
  constructor(element) {
    this.element = element;
    this.type = element.dataset.type;

    this.header = element.querySelector(".timer_header");
    this.h2 = element.querySelector(".timer_header_title");
    this.dateInput = element.querySelector(".timer_header_date_input");
    this.body = element.querySelector(".timer_body");

    this.date = null;
    this.data = {
      domains: [],
    };
    this.totalTime = null;

    this.filterElement = null;
    this.filter = {
      order: {
        type: null,
        direction: "none",
      },
      byTime: 0,
    };

    return this;
  }

  startup() {
    this.validOptions = {
      endDate: today,
    };

    let filter_element = template_timer_filter.cloneElement(".timer_item_filter");
    this.header.appendChild(filter_element);

    let order = filter_element.querySelector("[data-type='order']");
    let filter = filter_element.querySelector("[data-type='filter']");

    this.filterElement = {
      element: filter_element,
      button: this.element.querySelector(".timer_item_button_filter"),
      order: {
        element: order,
        buttons: {
          domains: order.querySelector("#domains"),
          time: order.querySelector("#time"),
        },
      },
      filter: {
        element: filter,
        timeFilter: order.querySelector("#time_filter"),
      },
      open: false,
    };

    // Set up filter buttons
    this.filterElement.order.buttons.domains.disable();

    for (const key in this.filterElement.order.buttons) {
      if (!Object.hasOwn(this.filterElement.order.buttons, key)) continue;

      const button = this.filterElement.order.buttons[key];

      button.onclick = () => {
        this.handleFilterChange(key);
      };
    }

    this.filterElement.button.onclick = () => {
      this.handleFilter();
    };
  }

  handleFilter() {
    if (this.filterElement.open) {
      this.filterElement.element.disable();
      this.filterElement.open = false;
    } else {
      this.filterElement.element.enable();
      this.filterElement.open = true;
      this.updateFilterPosition();
    }
  }

  updateFilterPosition() {
    // If filter is not open don't waste time
    if (!this.filterElement.open) return;

    let bound_button = this.filterElement.button.getBoundingClientRect();
    let bound_filter = this.filterElement.element.getBoundingClientRect();
    this.filterElement.element.style.left = `${
      bound_button.left + bound_button.width - bound_filter.width
    }px`;
    this.filterElement.element.style.top = `${
      bound_button.top + bound_button.height + window.scrollY
    }px`;
  }

  updateFilterButtons(from_key) {
    for (const key in this.filterElement.order.buttons) {
      if (!Object.hasOwn(this.filterElement.order.buttons, key)) continue;

      let button = this.filterElement.order.buttons[key];
      button.removeAttribute("data-selected");

      button.classList.remove(`arrow_bar_ascending`);
      button.classList.remove(`arrow_bar_descending`);
      button.classList.remove(`arrow_alphabet_ascending`);
      button.classList.remove(`arrow_alphabet_descending`);
      button.classList.add(`sort`);
    }

    // If don't want to sort return here for arrow no sort effect
    if (this.filter.order.type == null) return;

    let selected_button = this.filterElement.order.buttons[from_key];
    selected_button.setAttribute("data-selected", "true");
    selected_button.classList.remove("sort");

    if (from_key == "time") {
      selected_button.classList.add(`arrow_bar_${this.filter.order.direction}`);
    } else {
      selected_button.classList.add(`arrow_alphabet_${this.filter.order.direction}`);
    }
  }

  handleFilterChange(from_key) {
    let direction = "ascending";
    let sorting = true;

    // Same filter as the current selected
    if (this.filter.order.type == from_key) {
      if (this.filter.order.direction == "ascending") {
        direction = "descending";
      } else {
        sorting = false;
      }
    }

    // If want to sort
    if (sorting) {
      this.filter.order.type = from_key;
      this.filter.order.direction = direction;
      this.update({ fromFilter: true });
    } else {
      this.filter.order.type = null;
      this.filter.order.direction = "none";
      this.valid();
    }

    this.updateFilterButtons(from_key);
  }

  valid() {
    // No date selected
    if (this.dateInput.value == "") {
      this.newInformation("error", `Select a *date* to see it's summary`);
      return false;
    }

    this.date = getDateInfo(this.dateInput.value);

    // Date selected in the future
    if (compareDates(this.date, this.validOptions.endDate).difference > 0) {
      this.newInformation("error", `Select a *valid* date to see it's summary`);
      return false;
    }
    return true;
  }

  calculateDataOfWeek(days_of_week) {
    let passed_today = false;
    let total_result = {
      days: {},
      totalTime: 0,
    };

    // Go thourght the 7 days if that week
    days_of_week.forEach((day) => {
      let tracked_day = tracked_time_history_local.trackedDates[day];
      let day_result = {
        totalTime: 0,
        futureDate: passed_today,
      };

      // See if it exists in tracked_time_history_local
      if (tracked_day) {
        // Check to see if its finished
        if (tracked_day.trackingFinished) {
          // As it is finished just get the data from there directly
          day_result = tracked_day;
        } else {
          // As the tracking is unfinished, get the data from the tracking_time
          day_result = tracking_time_local;
          passed_today = true;
        }
      }

      // Put the data got in the data.days
      total_result.days[day] = day_result;
      // Sum the time of the totaltime spent on the week by the day's total time
      total_result.totalTime += day_result.totalTime;
    });

    return total_result;
  }

  newInformation(type, message = "") {
    let new_item = null;

    if (type == "no_data") {
      new_item = template_timer_no_data.cloneElement(".timer_item_no_data");
    } else if (type == "error") {
      this.h2.textContent = `${this.type.capitalize()} summary`;
      new_item = template_timer_invalid.cloneElement(".timer_item_invalid");
    } else {
      console.error(`newInformation(): No defined type for "${type}"`);

      this.h2.textContent = `An error occured`;
      message = "An error occured";
      new_item = template_timer_invalid.cloneElement(".timer_item_invalid");
    }

    let want_strong_tag = message.match(/\*[^\*]+\*/g);
    // If want bold text
    if (want_strong_tag != null) {
      new_item.innerText = "";
      let last_strong_pos = 0;

      // For each in between * tag
      want_strong_tag.forEach((matched) => {
        let pos = message.indexOf(matched);

        // new_item.innerText += message.slice(last_strong_pos, pos);
        let span_element = document.createElement("span");
        span_element.textContent = message.slice(last_strong_pos, pos);
        new_item.appendChild(span_element);

        let strong_element = document.createElement("strong");
        strong_element.textContent = matched.replaceAll("*", "");
        new_item.appendChild(strong_element);

        last_strong_pos = pos + matched.length;
      });

      let text_after_strong = message.slice(last_strong_pos);

      // Add text after the last strong tag
      if (text_after_strong) {
        let span_element = document.createElement("span");
        span_element.textContent = message.slice(last_strong_pos);
        new_item.appendChild(span_element);
      }
    } else {
      // If don't want bold text
      new_item.innerText = message;
    }

    this.body.appendChild(new_item);
  }

  newTotal() {
    // Create row of the total sum
    let total = this.newItem({
      name: "Total",
      time: this.totalTime,
    });
    total.classList.add("timer_item_total");
    this.body.appendChild(total);
  }

  newDomain(domain) {
    return this.newItem({
      name: domain.url,
      time: domain.time,
    });
  }

  newItem(options_passed) {
    let options = {
      name: options_passed.name ?? null,
      time: options_passed.time ?? 0,
    };

    let new_item = template_timer_item_date.cloneElement(".timer_item_data");
    let percent = options.time / this.totalTime || 0;
    let formatted_time = formatTime(options.time);

    new_item.querySelector(".timer_item_data_name").textContent = options.name;
    new_item.querySelector(".timer_item_data_time").textContent = formatted_time.timeString;

    let timer_progress = new_item.querySelector(".timer_item_data_progress");

    // Create full hours
    for (let i = 0; i < formatted_time.hours; i++) {
      let progress_fill = document.createElement("div");
      progress_fill.classList.add("timer_item_data_progress_fill");
      timer_progress.appendChild(progress_fill);
    }
    // Create minute barr
    let progress_fill = document.createElement("div");
    progress_fill.classList.add("timer_item_data_progress_fill");
    progress_fill.style.setProperty("--hours", formatted_time.minutes / 60);
    timer_progress.appendChild(progress_fill);

    new_item.querySelector(".timer_item_data_percentage").textContent = `${Math.round(
      percent * 100,
    )}%`;

    return new_item;
  }
}
