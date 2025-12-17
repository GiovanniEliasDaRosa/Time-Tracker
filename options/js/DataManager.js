class DataManager {
  constructor() {
    this.element = document.querySelector(".section_options.data");

    this.selectedTab = null;
    this.currentSessionDefaults = {
      active: false,
      options: {},
      data: {},
      error: {
        active: false,
        message: null,
      },
    };
    this.currentSession = this.currentSessionDefaults;

    this.feedbacks = this.element.querySelector(".data_feedbacks");
    this.feedbacksProgressFill = this.element.querySelector(".data_feedback_progress_fill");

    this.tabs = {
      export: {
        button: this.element.querySelector("#data_export_button"),
        feedback: this.element.querySelector(".data_feedback_export"),
        stepsElements: Array.from(
          this.element.querySelectorAll(".data_feedback_export > .data_feedbacks_step")
        ),
        stepCurrent: 0,
      },
      import: {
        button: this.element.querySelector("#data_import_button"),
        feedback: this.element.querySelector(".data_feedback_import"),
        stepsElements: Array.from(
          this.element.querySelectorAll(".data_feedback_import > .data_feedbacks_step")
        ),
        stepCurrent: 0,
      },
      delete: {
        button: this.element.querySelector("#data_delete_button"),
        feedback: this.element.querySelector(".data_feedback_delete"),
        stepsElements: Array.from(
          this.element.querySelectorAll(".data_feedback_delete > .data_feedbacks_step")
        ),
        stepCurrent: 0,
      },
    };

    this.nextStepButton = this.element.querySelector("#data_feedbacks_next_step_button");
    this.nextStepButton.onclick = () => {
      this.nextStep();
    };

    this.waitNextStepTimeout = null;
    this.waitProgressFillTimeout = null;

    let download_button = this.element
      .querySelector(".data_feedback_export")
      .querySelector("#data_download_button");

    download_button.onclick = () => {
      this.updateFeedback();
    };

    for (const key in this.tabs) {
      if (!Object.hasOwn(this.tabs, key)) continue;

      const tab = this.tabs[key];

      tab.button.onclick = () => {
        this.currentSession = this.currentSessionDefaults;

        this.selectedTab = key;
        this.tabs[this.selectedTab].stepCurrent = 0;
        this.updateFeedback();
      };
    }
  }

  nextStep() {
    this.tabs[this.selectedTab].stepCurrent++;
    this.updateFeedback();
  }

  updateFeedback() {
    let current_tab = this.tabs[this.selectedTab];
    this.nextStepButton.disable();
    clearTimeout(this.waitNextStepTimeout);

    // The selected step is greater that the quantity of steps available
    if (current_tab.stepCurrent > current_tab.stepsElements.length - 1) {
      return;
    }

    for (const key in this.tabs) {
      if (!Object.hasOwn(this.tabs, key)) continue;

      const tab = this.tabs[key];
      tab.button.removeAttribute("data-selected-tab");
      tab.feedback.disable();
    }

    current_tab.feedback.enable();
    current_tab.button.setAttribute("data-selected-tab", "true");
    this.feedbacks.enable();

    this.updateStep(current_tab);
  }

  updateStep(current_tab) {
    current_tab.stepsElements.forEach((step) => {
      step.disable();
    });
    current_tab.stepsElements[current_tab.stepCurrent].enable();

    clearTimeout(this.waitProgressFillTimeout);
    this.feedbacksProgressFill.style.transition = "";
    this.feedbacksProgressFill.style.width = "0%";

    if (this.selectedTab == "export") {
      this.exportStepUpdate(current_tab);
    } else if (this.selectedTab == "import") {
      this.importStepUpdate(current_tab);
    } else if (this.selectedTab == "delete") {
      this.deleteStepUpdate(current_tab);
    }

    this.waitProgressFillTimeout = setTimeout(() => {
      this.feedbacksProgressFill.style.transition = "width 0.5s ease-out";
      this.feedbacksProgressFill.style.width = "100%";
    }, 10);
  }

  async exportStepUpdate(current_tab) {
    let current_step = current_tab.stepCurrent;
    let current_step_element = current_tab.stepsElements[current_step];

    if (current_step == 0) {
      // * Screen to select to export time or config or both

      this.currentSession.active = true;

      let time_checkbox = current_step_element.querySelector("#data_time_checkbox");
      let config_checkbox = current_step_element.querySelector("#data_config_checkbox");
      let error_message = current_step_element.querySelector(".data_feedbacks_step_error_message");

      // It returned a step, because something is missing, or need to check at least one option
      if (this.currentSession.error.active) {
        time_checkbox.closest(".data_feedbacks_step_options_option").classList.add("input_error");
        config_checkbox.closest(".data_feedbacks_step_options_option").classList.add("input_error");
        error_message.innerText = this.currentSession.error.message;
        error_message.enable();
      } else {
        // If it's the first time, make both cheked as default
        time_checkbox.checked = true;
        config_checkbox.checked = true;

        time_checkbox
          .closest(".data_feedbacks_step_options_option")
          .classList.remove("input_error");
        config_checkbox
          .closest(".data_feedbacks_step_options_option")
          .classList.remove("input_error");
        error_message.disable();
      }

      this.nextStepButton.enable();
    } else if (current_step == 1) {
      // * Screen to validate and get the actual data

      let past_step_element = current_tab.stepsElements[current_tab.stepCurrent - 1];

      this.currentSession.options.time =
        past_step_element.querySelector("#data_time_checkbox").checked;
      this.currentSession.options.configurations =
        past_step_element.querySelector("#data_config_checkbox").checked;

      // Unchecked both boxes
      if (
        this.currentSession.options.time == false &&
        this.currentSession.options.configurations == false
      ) {
        this.currentSession.error = {
          active: true,
          message: "Check at least one option",
        };
        current_tab.stepCurrent--;
        this.updateFeedback(current_tab, true);
        return;
      }

      let options = [];

      if (this.currentSession.options.time) {
        options.push("tracking_time");
        options.push("tracked_time_history");
      }

      if (this.currentSession.options.configurations) {
        options.push("configurations");
      }

      let response = await MessageManager.send({
        type: "get",
        options: options,
      });

      if (this.currentSession.options.time) {
        // Put the todays time into the tracked history, easier to get when importing
        response.trackedTimeHistory.trackedDates[response.trackingTime.isoDate].domains =
          response.trackingTime.domains;
        response.trackedTimeHistory.trackedDates[response.trackingTime.isoDate].totalTime =
          response.trackingTime.totalTime;

        this.currentSession.data.time = response.trackedTimeHistory;
      }

      if (this.currentSession.options.configurations) {
        this.currentSession.data.configurations = response.configurations;
      }

      this.waitNextStepTimeout = setTimeout(() => {
        this.nextStep();
      }, 500);
    } else {
      // * Screen to download

      let data = JSON.stringify(this.currentSession.data);
      let blob = new Blob([data], { type: "application/json" });
      let url = URL.createObjectURL(blob);

      let now_date = getDateInfo(new Date());

      let link = document.createElement("A");
      link.href = url;
      link.download = `${now_date.isoDate}-Time-Tracker.json`;
      document.body.appendChild(link);

      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  }

  importStepUpdate() {}

  deleteStepUpdate() {}
}
