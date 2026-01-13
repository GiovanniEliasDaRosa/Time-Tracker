class TimerManager {
  constructor(element) {
    console.warn("new (TimerManager)");
    this.element = element;
    this.type = element.dataset.type;

    if (this.type == "day") {
      console.warn("day");
    } else if (this.type == "week") {
      console.warn("week");
    } else if (this.type == "month") {
      console.warn("month");
    } else {
      console.error("Error, no type found for ", type);
      return;
    }

    this.h2 = element.querySelector(".timer_header_title");
    this.dateInput = element.querySelector(".timer_header_date_input");
    this.body = element.querySelector(".timer_body");

    this.date = null;
    this.data = null;
    this.totalTime = null;

    return this;
  }

  valid() {
    // No date selected
    if (this.dateInput.value == "") {
      this.newInformation("error", `Select a *date* to see it's summary`);
      return false;
    }

    this.date = getDateInfo(this.dateInput.value);

    // Date selected in the future
    if (compareDates(this.date, today).difference > 0) {
      this.newInformation("error", `Select a *valid* date to see it's summary`);
      return false;
    }
    return true;
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
      percent * 100
    )}%`;

    return new_item;
  }
}
