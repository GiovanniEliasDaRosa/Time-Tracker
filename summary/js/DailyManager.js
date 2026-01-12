class DailyManager extends TimerManager {
  constructor(element) {
    super(element);
    /*
     * Inherited from TimerManager:
     * - this.element
     * - this.type
     * - this.h2
     * - this.dateInput
     * - this.body
     * - this.date
     * - this.data
     * - this.totalTime
     */

    this.isToday = false;

    this.bodyMore = element.querySelector(".timer_body_more");
    this.showMore = {
      button: element.querySelector(".button_show_more"),
      span_more: element.querySelector(".button_show_more_span_more"),
      span_less: element.querySelector(".button_show_more_span_less"),
      open: false,
      timeout: null,
    };
    this.bodyMore.disable();

    this.showMore.button.onclick = this.updateShowMore.bind(this);
    this.dateInput.oninput = this.valid.bind(this);

    this.isShowingMore = false;

    // Handle resizes on the page while animation to show more is running
    window.onresize = () => {
      if (!this.isShowingMore) return;

      clearTimeout(this.showMore.timeout);

      this.showMore.timeout = setTimeout(() => {
        // Get the current height
        let current_height = this.bodyMore.getBoundingClientRect().height;

        // Get the target height
        this.bodyMore.style.height = "auto";
        let target_height = this.bodyMore.getBoundingClientRect().height;

        // Go back to the current height
        this.bodyMore.style.height = current_height + "px";

        this.bodyMore.style.animationPlayState = "paused";

        this.showMore.timeout = setTimeout(() => {
          // Get back
          if (this.bodyMore.classList.contains("will_animate_in")) {
            // Wait to the height be 1em and the pre-loader finish
            this.showMore.timeout = setTimeout(() => {
              // Remove unecessary classes, that is of no use anymore
              this.bodyMore.classList.remove("animate_height");
              this.bodyMore.classList.remove("will_animate_in");

              // Add the real animation from 1em to the height of the content
              this.bodyMore.classList.add("animate_in");
              this.bodyMore.style.height = target_height + "px";
              this.bodyMore.style.animationPlayState = "running";

              // On finishing transisioning the height
              this.showMore.timeout = setTimeout(() => {
                // Remove unecessary class, to prevent any bugs of possibly happen
                this.bodyMore.classList.remove("animate_in");
                this.bodyMore.style.height = "";
                this.isShowingMore = false;
              }, 1000);
            }, 500);
          } else {
            this.showMore.timeout = setTimeout(() => {
              // Add the real animation from 1em to the height of the content
              this.bodyMore.classList.add("animate_in");
              this.bodyMore.style.height = target_height + "px";
              this.bodyMore.style.animationPlayState = "running";

              // On finishing transisioning the height
              this.showMore.timeout = setTimeout(() => {
                // Remove unecessary class, to prevent any bugs of possibly happen
                this.bodyMore.classList.remove("animate_in");
                this.bodyMore.style.height = "";
                this.isShowingMore = false;
              }, 1000);
            }, 250);
          }
        }, 10);
      }, 10);
    };

    return this;
  }

  valid() {
    this.body.innerHTML = "";
    this.bodyMore.innerHTML = "";
    this.h2.textContent = "";

    this.bodyMore.disable();
    this.showMore.button.disable();

    // Call base class to do input validation
    let valid = super.valid();

    // If invalid date return
    if (!valid) return;

    this.isToday = this.dateInput.value == today.isoDate;

    if (this.isToday) {
      this.date = today;
    } else {
      this.date = getDateInfo(this.dateInput.value);
    }

    this.update();
  }

  update() {
    if (this.isToday) {
      this.data = tracking_time_local;
    } else {
      let search = tracked_time_history_local.trackedDates[this.date.isoDate];

      // If didn't find data have
      if (search == null) {
        this.data = {
          domains: [],
        };
      } else {
        this.data = search;
      }
    }

    let result = compareDates(this.date, today, true);
    let result_date = "";

    if (result.dayDifference == "") {
      result_date = this.date.weekday;
    } else {
      result_date = result.dayDifference;
    }

    this.h2.textContent = `${result_date}, ${this.date.monthLong} ${this.date.day}, ${this.date.year}`;

    // If the date has no data
    if (this.data.domains.length == 0) {
      this.newInformation("no_data", `No data was found`);
      return;
    }

    this.updateShowMore(false);

    // Sort from biggest to smallest time spent
    this.data.domains.sort(function (a, b) {
      return b.time > a.time;
    });

    this.totalTime = this.data.totalTime;

    let domains = Array.from(this.data.domains);
    let top_domains = domains.splice(0, 10);
    let other_domains = domains;

    // Create row of the total sum
    this.newTotal();

    this.addTimerData(this.body, top_domains);
    this.addTimerData(this.bodyMore, other_domains);

    this.bodyMore.disable();

    if (other_domains.length > 0) {
      this.showMore.button.enable();
    }

    return this;
  }

  addTimerData(parent, domains) {
    domains.forEach((domain) => {
      parent.appendChild(this.newDomain(domain));
    });
  }

  updateShowMore(show_more_override = true) {
    this.bodyMore.classList.remove("animate_height");
    this.bodyMore.classList.remove("will_animate_in");
    this.bodyMore.classList.remove("will_animate_out");
    this.bodyMore.classList.remove("animate_in");
    this.bodyMore.classList.remove("animate_out");

    this.showMore.span_more.disable({ hide: false });
    this.showMore.span_less.disable({ hide: false });

    clearTimeout(this.showMore.timeout);
    this.isShowingMore = false;

    if (this.showMore.open || !show_more_override) {
      this.showMore.span_more.enable();
      this.showMore.open = false;
      this.showMore.button.classList.remove("show_less");
      this.showMore.button.classList.remove("rotate_arrow_up");

      // Start the pre-loader animation
      this.bodyMore.classList.add("will_animate_out");

      // Add the real animation from 1em to the height of the content
      // On finishing transisioning the height

      // Reset height to get the bounding box size
      this.bodyMore.style.height = "";
      let height = this.bodyMore.getBoundingClientRect().height;
      this.bodyMore.style.height = height + "px";

      // Waits the pre-loader to finish
      this.showMore.timeout = setTimeout(() => {
        // Set the height to 1em and transition to it
        this.bodyMore.style.height = "1em";
        this.bodyMore.classList.add("animate_out");

        // Wait the transition to finish
        this.showMore.timeout = setTimeout(() => {
          // This transitions the height, and show the pre background of the pre-laoder, this is to make the text under don't appear
          // In this case, this serves as the second option
          this.bodyMore.classList.add("animate_height");

          // Remove unecessary class, to prevent any bugs of possibly happen
          this.bodyMore.classList.remove("will_animate_out");

          // Wait the pre-loader to dissapear
          this.showMore.timeout = setTimeout(() => {
            // Set height from 1em to 0
            this.bodyMore.style.height = "0";

            // Wait the height to animate
            this.showMore.timeout = setTimeout(() => {
              // Remove unecessarys classs, to prevent any bugs of possibly happen
              this.bodyMore.classList.remove("animate_out");
              this.bodyMore.classList.remove("animate_height");

              this.bodyMore.disable();
            }, 750);
          }, 250);
        }, 1000);
      }, 500);
    } else {
      this.showMore.span_less.enable();
      this.showMore.open = true;
      this.showMore.button.classList.add("show_less");
      this.showMore.button.classList.add("rotate_arrow_up");

      this.bodyMore.enable();

      // Reset height to get the bounding box size
      this.bodyMore.style.height = "";
      let height = this.bodyMore.getBoundingClientRect().height;
      this.bodyMore.style.height = "0";

      // This transitions the height, and show the pre background of the pre-laoder, this is to make the text under don't appear
      this.bodyMore.classList.add("animate_height");

      // Waits 0 ms, to make the transition happen
      this.showMore.timeout = setTimeout(() => {
        // Set height and transition to it
        this.bodyMore.style.height = "1em";

        this.showMore.timeout = setTimeout(() => {
          this.bodyMore.classList.add("will_animate_in");

          this.isShowingMore = true;

          this.showMore.timeout = setTimeout(() => {
            // Wait to the height be 1em and the pre-loader finish
            this.showMore.timeout = setTimeout(() => {
              // Remove unecessary classes, that is of no use anymore
              this.bodyMore.classList.remove("animate_height");
              this.bodyMore.classList.remove("will_animate_in");

              // Add the real animation from 1em to the height of the content
              this.bodyMore.classList.add("animate_in");
              this.bodyMore.style.height = height + "px";

              // On finishing transisioning the height
              this.showMore.timeout = setTimeout(() => {
                // Remove unecessary class, to prevent any bugs of possibly happen
                this.bodyMore.classList.remove("animate_in");
                this.bodyMore.style.height = "";
                this.isShowingMore = false;
              }, 1000);
            }, 250);
          }, 250);
        }, 250);
      }, 0);
    }
  }
}
