class Popup {
  constructor() {
    this.element = document.querySelector(".section_options.popup");

    this.presetButtons = this.element.querySelectorAll(
      ".popup_options_presets_button:not(.popup_options_presets_custom)"
    );

    this.presetCustomButton = this.element.querySelector(".popup_options_presets_custom");

    let customize_section = this.element.querySelector(
      ".section_options_section[data-for='customize']"
    );

    let custom_label_progress_text_placement = customize_section.querySelector(
      "label[for='popup_progress_text_placement']"
    );
    let custom_label_progress_axis = customize_section.querySelector(
      "label[for='popup_progress_axis'"
    );

    this.custom = {
      element: customize_section,
      optionsRectangularWrapper: customize_section.querySelector(".section_options_all"),
      optionsRectangular: customize_section.querySelector(".popup_options_section"),
      progressRectangular: customize_section.querySelector("#popup_progress_rectangular"),
      columns: customize_section.querySelector("#popup_columns"),
      progressTextPlacement: {
        label: custom_label_progress_text_placement,
        input: custom_label_progress_text_placement.querySelector("input"),
        warning: customize_section.querySelector(
          "label[for='popup_progress_text_placement'] + .warn_message"
        ),
      },
      progressAxis: {
        label: custom_label_progress_axis,
        input: custom_label_progress_axis.querySelector("input"),
        warning: customize_section.querySelector(
          "label[for='popup_progress_axis'] + .warn_message"
        ),
      },
      progressBarWidth: customize_section.querySelector("#popup_progress_width"),
    };

    this.waitSaveTimeout = "";
    this.currentValues = {
      selected: "preset",
      values: {
        columns: "1",
        progressTextPlacement: "outside",
        progressAxis: "horizontal",
        progressBarWidth: "large",
      },
    };

    this.waitUpdateTimeouts = {
      main: undefined,
      nested: undefined,
    };

    let preview = this.element.querySelector("#popup_options_preview");

    this.preview = {
      element: preview,
      progress: preview.querySelector(".summary_button_progress"),
      progressText: preview.querySelector(".summary_button_progress_text"),
      progressTextSpan: preview.querySelector(".summary_button_progress_text > span"),
      progressBarRectangular: preview.querySelector(".summary_button_progress_bar_rectangular"),
      progressBarCircular: preview.querySelector(".summary_button_progress_bar_circular"),
      progressBarRectangularFill: preview.querySelector(
        ".summary_button_progress_bar_rectangular_fill"
      ),
      progressBarCircularFill: preview.querySelector(
        ".summary_button_progress_bar_circular_svg_fill"
      ),
    };

    this.preview.progressBarRectangularFill.style.transition = "none";
    this.preview.progressBarCircularFill.style.transition = "none";
    this.preview.progressText.style.transition = "none";
    this.preview.progressTextSpan.style.transition = "none";

    this.selectedButtonIndex = 0;
  }

  setup() {
    this.presetButtons.forEach((button) => {
      const dataset = button.dataset;
      let starting_translation = null;

      let progress_bar_rectangular_fill = button.querySelector(
        ".summary_button_progress_bar_rectangular_fill"
      );
      let progress_bar_circular_fill = button.querySelector(
        ".summary_button_progress_bar_circular_svg_fill"
      );

      if (dataset.progressAxis != "circular") {
        starting_translation = getComputedStyle(progress_bar_rectangular_fill).translate;
      }

      button.onclick = async () => {
        this.selectedButtonIndex = dataset.id;
        this.updateSelectedButton();
        this.updatePreview({ dataset: dataset });

        if (dataset.progressAxis == "circular") {
          progress_bar_circular_fill.style.transition = "none";
        } else {
          progress_bar_rectangular_fill.style.transition = "none";
        }

        if (dataset.progressAxis == "circular") {
          progress_bar_circular_fill.style.setProperty("--percent", "0");
          progress_bar_circular_fill.style.setProperty("--progress", "0%");
        } else {
          progress_bar_rectangular_fill.style.translate = starting_translation;
        }

        await wait(1);

        if (dataset.progressAxis == "circular") {
          progress_bar_circular_fill.style.transition = "";
          progress_bar_circular_fill.style.removeProperty("--percent", "0");
          progress_bar_circular_fill.style.removeProperty("--progress", "0%");
        } else {
          progress_bar_rectangular_fill.style.transition = "";
          progress_bar_rectangular_fill.style.translate = "";
        }
      };
    });

    this.presetCustomButton.onclick = () => {
      this.selectedButtonIndex = Number(this.presetCustomButton.dataset.id);
      this.updateSelectedButton();
      this.updateCustomizeSection();
      this.updatePreview({ fromCustomize: true });
    };

    this.custom.progressRectangular.onchange = () => {
      this.handleDisplayRectangularUpdate();
      this.updatePreview({ fromCustomize: true });
    };

    let customize_inputs = [
      this.custom.columns,
      this.custom.progressTextPlacement.input,
      this.custom.progressAxis.input,
      this.custom.progressBarWidth,
    ];

    customize_inputs.forEach((customize_input) => {
      customize_input.onchange = () => {
        this.updatePreview({ fromCustomize: true });
      };
    });

    this.custom.element.disable();

    return this;
  }

  updateValue(options_passed = {}) {
    let options = {
      animate: options_passed.animate ?? true,
      save: options_passed.save ?? true,
    };

    let popup = configurations.popup;
    let selected = popup[popup.selected];

    this.customValuesSelected = popup.custom;

    this.custom.columns.checked = selected.columns == "2" ? true : false;
    this.custom.progressTextPlacement.input.checked = selected.progressTextPlacement == "inside";
    this.custom.progressRectangular.checked = selected.progressAxis != "circular";
    this.custom.progressAxis.input.checked = selected.progressAxis == "vertical";
    this.custom.progressBarWidth.checked = selected.progressBarWidth == "large";

    let show_customize = false;
    if (popup.selected == "preset") {
      show_customize = false;
      this.selectedButtonIndex = Number(selected.id);

      this.updatePreview({
        dataset: this.presetButtons[this.selectedButtonIndex].dataset,
        save: false,
      });
    } else {
      show_customize = true;
      this.selectedButtonIndex = Number(this.presetCustomButton.dataset.id);

      this.updatePreview({
        dataset: this.presetCustomButton.dataset,
        fromCustomize: true,
        save: false,
      });
    }

    this.updateSelectedButton();
    this.updateCustomizeSection(show_customize);
    this.handleDisplayRectangularUpdate(false);
  }

  handleDisplayRectangularUpdate(animate = true) {
    this.waitUpdateTimeouts = animatorAnimate({
      parent: this.custom.optionsRectangularWrapper,
      more: this.custom.optionsRectangular,
      enabled: this.custom.progressRectangular.checked,
      timeout: this.waitUpdateTimeouts,
      animate: animate,
    });
  }

  updateSelectedButton() {
    // Disable customize section
    this.custom.element.disable();

    // Remove data selected from all buttons
    this.presetButtons.forEach((button) => {
      button.removeAttribute("data-selected");
    });
    this.presetCustomButton.removeAttribute("data-selected");

    // If the last button is not in the presetButtons, its customize button,
    // because customize button is not a preset
    if (this.selectedButtonIndex > this.presetButtons.length - 1) {
      this.presetCustomButton.setAttribute("data-selected", "true");
      return;
    }

    // Now button is a preset

    // Get the current button selected
    let button_selected = this.presetButtons[this.selectedButtonIndex];
    button_selected.setAttribute("data-selected", "true");
  }

  updateCustomizeSection(show = true) {
    if (show) {
      // Enable customize section
      this.custom.element.enable();
    } else {
      // Hide customize section
      this.custom.element.disable();
    }
  }

  async updatePreview(options_passed = {}) {
    let options = {
      dataset: options_passed.dataset ?? null,
      fromCustomize: options_passed.fromCustomize ?? false,
      save: options_passed.save ?? true,
    };

    let attributes = {};

    if (options.fromCustomize) {
      attributes.columns = this.custom.columns.checked ? "2" : "1";

      attributes.progressTextPlacement = this.custom.progressTextPlacement.input.checked
        ? "inside"
        : "outside";

      if (this.custom.progressRectangular.checked) {
        attributes.progressAxis = this.custom.progressAxis.input.checked
          ? "vertical"
          : "horizontal";
      } else {
        attributes.progressAxis = "circular";
      }

      attributes.progressBarWidth = this.custom.progressBarWidth.checked ? "large" : "thin";

      // Save customize, as its the selected one

      this.currentValues.values = {
        columns: attributes.columns,
        progressTextPlacement: attributes.progressTextPlacement,
        progressAxis: attributes.progressAxis,
        progressBarWidth: attributes.progressBarWidth,
      };
      this.currentValues.selected = "custom";

      // Make the visual warnings appear and disable inputs now
      // If rogress type is VERTICAL
      if (this.custom.progressAxis.input.checked) {
        this.custom.progressTextPlacement.input.disable({ hide: false });
        this.custom.progressTextPlacement.label.disable({ hide: false });
        this.custom.progressTextPlacement.warning.enable();
      } else {
        this.custom.progressTextPlacement.input.enable();
        this.custom.progressTextPlacement.label.enable();
        this.custom.progressTextPlacement.warning.disable();
      }

      // If Progress text placement is INSIDE
      if (this.custom.progressTextPlacement.input.checked) {
        this.custom.progressAxis.input.disable({ hide: false });
        this.custom.progressAxis.label.disable({ hide: false });
        this.custom.progressAxis.warning.enable();
      } else {
        this.custom.progressAxis.input.enable();
        this.custom.progressAxis.label.enable();
        this.custom.progressAxis.warning.disable();
      }
    } else {
      attributes = Object.assign({}, options.dataset);

      attributes.columns = attributes.columns ?? 1;
      attributes.progressTextPlacement = attributes.progressTextPlacement ?? "outside";
      attributes.progressAxis = attributes.progressAxis ?? "horizontal";
      attributes.progressBarWidth = attributes.progressBarWidth ?? "large";

      this.currentValues.values = {
        id: attributes.id,
        columns: attributes.columns,
        progressTextPlacement: attributes.progressTextPlacement,
        progressAxis: attributes.progressAxis,
        progressBarWidth: attributes.progressBarWidth,
      };
      this.currentValues.selected = "preset";
    }

    this.preview.element.setAttribute("data-columns", attributes.columns);
    this.preview.element.setAttribute(
      "data-progress-text-placement",
      attributes.progressTextPlacement
    );
    this.preview.element.setAttribute("data-progress-axis", attributes.progressAxis);
    this.preview.element.setAttribute("data-progress-bar-width", attributes.progressBarWidth);

    if (attributes.progressAxis == "circular") {
      this.preview.progressBarRectangular.disable();
      this.preview.progressBarCircular.enable();
    } else {
      this.preview.progressBarRectangular.enable();
      this.preview.progressBarCircular.disable();
    }

    if (options.save) {
      this.waitToSave();
    }
  }

  waitToSave() {
    clearInterval(this.waitSaveTimeout);

    this.waitSaveTimeout = setTimeout(() => {
      this.save();
    }, 500);
  }

  async save() {
    configurations.popup[this.currentValues.selected] = this.currentValues.values;
    configurations.popup.selected = this.currentValues.selected;

    configurations = await Storage.set("configurations", configurations);

    await MessageManager.send({
      type: "set",
      options: ["configurations_popup"],
      data: configurations,
    });
  }
}
