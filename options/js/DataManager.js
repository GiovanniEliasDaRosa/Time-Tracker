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
      previousStep: -1,
    };
    this.currentSession = structuredClone(this.currentSessionDefaults);

    this.feedbacks = this.element.querySelector(".data_feedbacks");
    this.feedbacksProgressFill = this.element.querySelector(".data_feedback_progress_fill");

    let feedback_export = this.element.querySelector(".data_feedback_export");
    let feedback_import = this.element.querySelector(".data_feedback_import");
    let feedback_delete = this.element.querySelector(".data_feedback_delete");

    this.tabs = {
      export: {
        button: this.element.querySelector("#data_export_button"),
        feedback: feedback_export,
        stepsElements: Array.from(feedback_export.querySelectorAll(".data_feedbacks_step")),
        stepCurrent: 0,
      },
      import: {
        button: this.element.querySelector("#data_import_button"),
        feedback: feedback_import,
        stepsElements: Array.from(feedback_import.querySelectorAll(".data_feedbacks_step")),
        stepCurrent: 0,
        fileReader: new FileReader(),
        importFile: feedback_import.querySelector("#data_import_file"),
        importFileName: feedback_import.querySelector(".data_import_file_name"),
      },
      delete: {
        button: this.element.querySelector("#data_delete_button"),
        feedback: feedback_delete,
        stepsElements: Array.from(feedback_delete.querySelectorAll(".data_feedbacks_step")),
        stepCurrent: 0,
      },
    };

    this.nextStepButton = this.element.querySelector("#data_feedbacks_next_step_button");
    this.nextStepButton.onclick = () => {
      this.nextStep();
    };

    this.closeFeedbackButton = this.feedbacks.querySelector(
      "#data_feedbacks_close_feedback_button"
    );
    this.closeFeedbackButton.onclick = () => {
      this.closeFeedback();
    };

    this.waitNextStepTimeout = null;
    this.waitProgressFillTimeout = null;
    this.waitForNextStepTimeout = null;
  }

  // Setups
  setup() {
    for (const key in this.tabs) {
      if (!Object.hasOwn(this.tabs, key)) continue;

      const tab = this.tabs[key];

      tab.button.onclick = () => {
        this.currentSession = structuredClone(this.currentSessionDefaults);

        // Scroll button into view, in case of small screens
        tab.button.scrollIntoView({ behavior: "smooth", inline: "center" });

        this.selectedTab = key;
        this.tabs[this.selectedTab].stepCurrent = 0;
        this.updateFeedback();
      };
    }

    this.setupExport();
    this.setupImport();
    this.setupDelete();
  }

  setupExport() {
    this.tabs.export.feedback.querySelector("#data_download_button").onclick = () => {
      this.updateFeedback();
    };
  }

  setupImport() {
    this.tabs.import.importFileName.disable();

    this.tabs.import.importFile.oninput = () => {
      let files = this.tabs.import.importFile.files;

      this.tabs.import.stepsElements[0].querySelector(".error_message").disable();

      // Has no file selected
      if (files.length == 0) return;

      let file = files[0];

      this.tabs.import.importFileName.innerText = file.name;
      this.tabs.import.importFileName.enable();

      // Check if file isn't JSON, to show an error
      if (file.type.split("/")[1] != "json") {
        this.currentSession.error.active = true;
        this.currentSession.error.message = `Please upload a .json file, "${file.name}" is not a valid type.`;
        this.showErrorStep();
        return;
      }

      // File is JSON

      // Save the file name to be used in the next step, which reads the file
      this.currentSession.data.file = {
        name: file.name,
      };

      // Animate bar
      clearTimeout(this.waitProgressFillTimeout);
      this.feedbacksProgressFill.classList.remove("full");
      this.feedbacksProgressFill.style.width = "";

      this.waitProgressFillTimeout = setTimeout(() => {
        this.feedbacksProgressFill.classList.add("full");
      }, 10);

      // The next step starts reading the file
      // Wait 0.25 seconds
      this.waitForStep(1, 250);
    };

    // While reading show progress
    this.tabs.import.fileReader.onprogress = (e) => {
      // Can't compute the file length
      if (!e.lengthComputable) return;

      this.feedbacksProgressFill.style.width = `${(e.loaded / e.total) * 100}%`;
    };

    // File finished reading
    this.tabs.import.fileReader.onload = async (e) => {
      try {
        this.currentSession.data.file.data = JSON.parse(this.tabs.import.fileReader.result);

        if (this.currentSession.data.file.data.isEmpty()) {
          throw new Error("Empty object in JSON file");
        }
      } catch (e) {
        console.error(e);
        this.currentSession.error.active = true;
        this.currentSession.error.message = `The file "${this.currentSession.data.file.name}" contains invalid JSON.`;

        this.waitForStep(-1);
        return;
      }

      // Sucess on load file
      this.currentSession.error.active = false;
      this.currentSession.error.message = null;

      this.feedbacksProgressFill.style.width = "";
      this.feedbacksProgressFill.classList.add("full");

      this.waitForStep(1);
    };

    this.tabs.import.fileReader.onerror = (e) => {
      console.error(e);
      this.currentSession.error.active = true;
      this.currentSession.error.message = `An error occured while trying to read the file.`;

      this.waitForStep(-1);
    };
  }

  setupDelete() {
    // On press enter in "Confirm deletion" text input
    this.tabs.delete.feedback.querySelector("#data_delete_confirm_input").onkeyup = (e) => {
      if (e.code == "Enter") {
        this.nextStep();
      }
    };
  }

  // Update steps
  nextStep() {
    this.currentSession.previousStep = this.tabs[this.selectedTab].stepCurrent;
    this.tabs[this.selectedTab].stepCurrent++;
    this.updateFeedback();
  }

  previousStep() {
    this.currentSession.previousStep = this.tabs[this.selectedTab].stepCurrent;
    this.tabs[this.selectedTab].stepCurrent--;
    this.updateFeedback();
  }

  showErrorStep() {
    this.tabs[this.selectedTab].stepCurrent = 0;
    this.updateFeedback();
  }

  waitForStep(step_dir = 0, time = 500) {
    clearTimeout(this.waitForNextStepTimeout);

    this.waitForNextStepTimeout = setTimeout(() => {
      // User didn't close the feedback
      if (this.selectedTab != null) {
        if (step_dir == 1) {
          this.nextStep();
        } else if (step_dir == -1) {
          this.previousStep();
        }
      }
    }, time);
  }

  updateFeedback() {
    let current_tab = this.tabs[this.selectedTab];
    this.nextStepButton.disable();
    clearTimeout(this.waitNextStepTimeout);
    clearTimeout(this.waitForNextStepTimeout);

    for (const key in this.tabs) {
      if (!Object.hasOwn(this.tabs, key)) continue;

      const tab = this.tabs[key];
      tab.button.removeAttribute("data-selected-tab");
      tab.feedback.disable();
    }

    // Closing feedback
    if (current_tab == null) {
      this.feedbacks.disable();
      return;
    }

    // The selected step is greater that the quantity of steps available
    if (current_tab.stepCurrent > current_tab.stepsElements.length - 1) {
      return;
    }

    current_tab.feedback.enable();
    current_tab.button.setAttribute("data-selected-tab", "true");
    this.feedbacks.enable();
    this.feedbacks.removeAttribute("data-success");

    this.updateStep(current_tab);
  }

  closeFeedback() {
    this.selectedTab = null;
    this.updateFeedback();
  }

  async updateStep(current_tab) {
    current_tab.stepsElements.forEach((step) => {
      step.disable();
    });
    current_tab.stepsElements[current_tab.stepCurrent].enable();
    this.element.scrollIntoView({ behavior: "instant", block: "start" });

    clearTimeout(this.waitProgressFillTimeout);
    this.feedbacksProgressFill.classList.remove("reading_file");
    this.feedbacksProgressFill.classList.remove("full");
    this.feedbacksProgressFill.style.width = "";

    let animate_full = true;
    if (this.selectedTab == "export") {
      this.exportStepUpdate(current_tab);
    } else if (this.selectedTab == "import") {
      animate_full = (await this.importStepUpdate(current_tab)) ?? true;
    } else if (this.selectedTab == "delete") {
      this.deleteStepUpdate(current_tab);
    }

    if (!animate_full) return;

    this.waitProgressFillTimeout = setTimeout(() => {
      this.feedbacksProgressFill.classList.add("full");
    }, 10);
  }

  async sendMessageWithOptions(options_passed = {}) {
    let options = [];

    if (options_passed.todayDate) {
      options.push("today_date");
    }

    if (this.currentSession.options.time) {
      options.push("tracking_time");
      options.push("tracked_time_history");
    }

    if (this.currentSession.options.configurations) {
      options.push("configurations");
    }

    return await MessageManager.send({
      type: "get",
      options: options,
    });
  }

  // Update export steps
  async exportStepUpdate(current_tab) {
    let current_step = current_tab.stepCurrent;
    let current_step_element = current_tab.stepsElements[current_step];

    if (current_step == 0) {
      // * Screen to select to export time or config or both

      this.currentSession.active = true;

      let time_checkbox = current_step_element.querySelector("#data_time_checkbox");
      let config_checkbox = current_step_element.querySelector("#data_config_checkbox");
      let error_message = current_step_element.querySelector(".error_message");

      // It returned a step, because something is missing, or need to check at least one option
      if (this.currentSession.error.active) {
        time_checkbox.parentElement.classList.add("input_error");
        config_checkbox.parentElement.classList.add("input_error");
        error_message.innerText = this.currentSession.error.message;
        error_message.enable();
      } else {
        // If it's the first time, make both cheked as default
        time_checkbox.checked = true;
        config_checkbox.checked = true;

        time_checkbox.parentElement.classList.remove("input_error");
        config_checkbox.parentElement.classList.remove("input_error");
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
        this.previousStep();
        return;
      }

      let response = await this.sendMessageWithOptions();

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

      this.feedbacks.setAttribute("data-success", "true");
    }
  }

  // Update import steps
  async importStepUpdate(current_tab) {
    let current_step = current_tab.stepCurrent;
    let current_step_element = current_tab.stepsElements[current_step];

    if (current_step == 0) {
      // * Screen to select file
      // Cancel file reader, as the user will upload a new file
      this.tabs.import.fileReader.abort();

      this.currentSession.active = true;

      let error_message = current_step_element.querySelector(".error_message");

      if (this.currentSession.error.active) {
        error_message.innerText = this.currentSession.error.message;
        error_message.enable();
        return;
      }

      this.tabs.import.importFile.value = "";
      this.tabs.import.importFileName.disable();

      error_message.disable();
    } else if (current_step == 1) {
      // * Screen of reading file

      // Start reading the file
      clearTimeout(this.waitProgressFillTimeout);
      this.feedbacksProgressFill.classList.remove("full");
      this.feedbacksProgressFill.style.width = "";
      this.feedbacksProgressFill.classList.add("reading_file");

      this.tabs.import.fileReader.readAsText(this.tabs.import.importFile.files[0]);

      current_step_element.querySelector(".data_feedbacks_step_file_name").innerText =
        this.currentSession.data.file.name;

      return false;
    } else if (current_step == 2) {
      // * Screen of what do you want to import?

      let time_checkbox = current_step_element.querySelector("#data_import_time_checkbox");
      let time_checkbox_parent = time_checkbox.parentElement;

      let config_checkbox = current_step_element.querySelector("#data_import_config_checkbox");
      let config_checkbox_parent = config_checkbox.parentElement;

      let error_message = current_step_element.querySelector(".error_message");

      // It returned a step, because it needs to check at least one option
      if (this.currentSession.error.active) {
        time_checkbox_parent.classList.add("input_error");
        config_checkbox_parent.classList.add("input_error");
        error_message.innerText = this.currentSession.error.message;
        error_message.enable();
      } else {
        // If both keys where not detected
        if (
          this.currentSession.data.file.data.time == null &&
          this.currentSession.data.file.data.configurations == null
        ) {
          this.currentSession.error.active = true;
          this.currentSession.error.message = "The file contains no valid data.";
          this.showErrorStep();
          return;
        }

        // If no detection of time in the import
        if (this.currentSession.data.file.data.time == null) {
          time_checkbox.checked = false;
          time_checkbox.disable({ hide: false, lookDisabled: false });
          time_checkbox_parent.disable({ hide: false });
        } else {
          time_checkbox.checked = true;
          time_checkbox.enable();
          time_checkbox_parent.enable();
        }

        // If no detection of configurations in the import
        if (this.currentSession.data.file.data.configurations == null) {
          config_checkbox.checked = false;
          config_checkbox.disable({ hide: false, lookDisabled: false });
          config_checkbox_parent.disable({ hide: false });
        } else {
          config_checkbox.checked = true;
          config_checkbox.enable();
          config_checkbox_parent.enable();
        }

        time_checkbox_parent.classList.remove("input_error");
        config_checkbox.parentElement.classList.remove("input_error");
        error_message.disable();
      }

      this.nextStepButton.enable();
    } else if (current_step == 3) {
      // * Screen to validate and get the current extension data

      let past_step_element = current_tab.stepsElements[current_tab.stepCurrent - 1];

      this.currentSession.options.time = past_step_element.querySelector(
        "#data_import_time_checkbox"
      ).checked;
      this.currentSession.options.configurations = past_step_element.querySelector(
        "#data_import_config_checkbox"
      ).checked;

      // Unchecked both boxes
      if (
        this.currentSession.options.time == false &&
        this.currentSession.options.configurations == false
      ) {
        this.currentSession.error = {
          active: true,
          message: "Check at least one option",
        };
        this.previousStep();
        return;
      }

      // Valid data

      this.currentSession.data.current = await this.sendMessageWithOptions({ todayDate: true });

      // If don't want to import time, skip conflict screens
      if (!this.currentSession.options.time) {
        this.currentSession.options.conflictDate = null;
        this.nextStep(1);
        return;
      }

      this.waitForStep(1);
    } else if (current_step == 4) {
      // * Screen of checking conflicts

      // If don't want to import time, skip conflict screens
      if (!this.currentSession.options.time) {
        this.nextStep(1);
        return;
      }

      let today = this.currentSession.data.current.todayDate;
      let current = this.currentSession.data.current;
      let imported = this.currentSession.data.file.data.time;
      imported.lastTrack = getDateInfo(imported.lastTrack);
      let imported_last_tracked_data = imported.trackedDates[imported.lastTrack.isoDate];
      let current_last_tracked_data = null;

      /*
       * Check and reject import if the file's last date is afeter the system date
       * Possible causes:
       * - System clock was set to an ahead date (most likely)
       * - Export file was modified (unlikely unless user edited JSON)
       */
      if (compareDates(today, imported.lastTrack).difference < 0) {
        this.currentSession.error.active = true;
        this.currentSession.error.message = `Imported data contains date(s) after computer's current date (${today.date}).
Check if your system clock is correct.`;
        this.showErrorStep();
        return;
      }

      // The last day of the import matches is today
      if (imported.lastTrack.isoDate == current.trackingTime.isoDate) {
        current_last_tracked_data = current.trackingTime;
      } else {
        let search = current.trackedTimeHistory.trackedDates[imported.lastTrack.isoDate];

        // No date found, means no conflict or
        // Date found with no domains saved
        if (search == null || search.domains == null || search.domains.length == 0) {
          this.currentSession.options.conflictDate = null;
          this.waitForStep(1);
          return;
        }

        // If found a conflict set date of it
        current_last_tracked_data = search;
      }

      // Check if last tracked day of import or current has no data, this way no conflict
      if (imported_last_tracked_data.totalTime == 0 || current_last_tracked_data.totalTime == 0) {
        this.currentSession.options.conflictDate = null;
        this.waitForStep(1);
        return;
      }

      // * At this point a conflit was found
      this.currentSession.options.conflictDate = getDateInfo(current_last_tracked_data.isoDate);

      this.waitForStep(1);
    } else if (current_step == 5) {
      // * Screen of conflict found, and select an option to resolve

      // No conflict found, go to next step
      if (this.currentSession.options.conflictDate == null) {
        this.nextStep();
        return;
      }

      let date_conflict = current_step_element.querySelector(".data_feedbacks_step_date_conflict");
      date_conflict.innerText = this.currentSession.options.conflictDate.date;

      let import_merge = current_step_element.querySelector("#data_import_merge");

      import_merge.checked = true;

      this.nextStepButton.enable();
    } else if (current_step == 6) {
      // * Screen of importing

      let result = {};

      // If want to import configurations
      if (this.currentSession.options.configurations) {
        result.configurations = this.currentSession.data.file.data.configurations;
        configurations = result.configurations;
      }

      // If want to import time
      if (this.currentSession.options.time) {
        let past_step_element = current_tab.stepsElements[current_tab.stepCurrent - 1];

        let conflict_resolve_option = past_step_element.querySelector(
          "input[name='data_import_conflict']:checked"
        );

        result.time = this.currentSession.data.file.data.time;

        // Has no conflicts
        if (this.currentSession.options.conflictDate == null) {
          result.type = "no_conflicts";
        } else {
          // Has  conflicts
          switch (conflict_resolve_option.id) {
            case "data_import_merge":
              // Merge (Add together)
              result.type = "merge";
              break;
            case "data_import_keep":
              // Keep local (Keep saved only)
              result.type = "keep_local";
              break;
            case "data_import_replace":
              // Replace with import (Keep import only)
              result.type = "replace_import";
              break;
          }
        }
      }

      await MessageManager.send({
        type: "set",
        options: ["import"],
        data: result,
      });

      this.waitForStep(1);
    } else {
      // * Screen of success
      this.feedbacks.setAttribute("data-success", "true");

      if (this.currentSession.options.configurations) {
        updatedConfigurations({ animate: true });
      }
    }

    return true;
  }

  // Update delete steps
  async deleteStepUpdate(current_tab) {
    let current_step = current_tab.stepCurrent;
    let current_step_element = current_tab.stepsElements[current_step];

    if (current_step == 0) {
      // * Screen to select what to delete
      this.currentSession.active = true;

      let time_checkbox = current_step_element.querySelector("#data_delete_time_checkbox");
      let config_checkbox = current_step_element.querySelector("#data_delete_config_checkbox");
      let error_message = current_step_element.querySelector(".error_message");

      // It returned a step, because something  need to check at least one option
      if (this.currentSession.error.active) {
        time_checkbox.parentElement.classList.add("input_error");
        config_checkbox.parentElement.classList.add("input_error");
        error_message.innerText = this.currentSession.error.message;
        error_message.enable();
      } else {
        // If it's the first time, make both cheked as default
        time_checkbox.checked = false;
        config_checkbox.checked = false;

        time_checkbox.parentElement.classList.remove("input_error");
        config_checkbox.parentElement.classList.remove("input_error");
        error_message.disable();
      }

      this.nextStepButton.enable();
    } else if (current_step == 1) {
      // * Screen to validate and confirm deletion

      let past_step_element = current_tab.stepsElements[current_tab.stepCurrent - 1];

      this.currentSession.options.time = past_step_element.querySelector(
        "#data_delete_time_checkbox"
      ).checked;
      this.currentSession.options.configurations = past_step_element.querySelector(
        "#data_delete_config_checkbox"
      ).checked;

      // Unchecked both boxes
      if (
        this.currentSession.options.time == false &&
        this.currentSession.options.configurations == false
      ) {
        this.currentSession.error = {
          active: true,
          message: "Check at least one option",
        };
        this.previousStep();
        return;
      }

      let confirm_input = current_step_element.querySelector("#data_delete_confirm_input");
      let error_message = current_step_element.querySelector(".error_message");

      // It returned a step the confirm value didn't match
      if (this.currentSession.error.active && this.currentSession.previousStep == 2) {
        confirm_input.classList.add("input_error");
        error_message.innerText = this.currentSession.error.message;
        error_message.enable();
      } else {
        // If it's the first time, make both cheked as default
        confirm_input.value = "";
        confirm_input.classList.remove("input_error");
        error_message.disable();
      }

      this.nextStepButton.enable();
    } else if (current_step == 2) {
      // * Screen to delete/reset

      this.currentSession.error.active = false;
      this.currentSession.error.message = null;

      let past_step_element = current_tab.stepsElements[current_tab.stepCurrent - 1];

      let confirm_input = past_step_element.querySelector("#data_delete_confirm_input");

      // Get the input value and remove spaces before and after string
      let inputed = confirm_input.value.trim();

      // Replace more than 1 spaces to 1 space only
      inputed = inputed.replace(/\ +/g, " ");

      // The value inputed is not the expected
      if (inputed != "confirm deletion") {
        this.currentSession.error = {
          active: true,
          message: "The required value doesn't match with input",
        };
        this.previousStep();
        return;
      }

      // The input is correct

      let options = [];

      if (this.currentSession.options.time) {
        options.push("time");
      }
      if (this.currentSession.options.configurations) {
        options.push("configurations");
      }

      this.currentSession.options.selected = options;

      current_step_element.querySelector(".data_feedbacks_step_selected_options").innerText =
        this.currentSession.options.selected.join(" and ");

      // Send a delete message
      await MessageManager.send({
        type: "delete",
        options: options,
      });

      this.waitForStep(1);
    } else {
      // * Screen of success

      current_step_element.querySelector(".data_feedbacks_step_selected_options").innerText =
        this.currentSession.options.selected.join(" and ");

      updatedConfigurations({ animate: true });
    }
  }
}
