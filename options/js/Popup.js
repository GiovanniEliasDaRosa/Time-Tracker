class Popup {
  constructor() {
    this.element = document.querySelector(".section_options.popup");

    this.presetButtons = this.element.querySelectorAll(
      ".popup_options_presets_button:not(.popup_options_presets_custom)"
    );

    this.presetCustomButton = this.element.querySelector(".popup_options_presets_custom");

    this.custom = {
      element: this.element.querySelector(".section_options_section[data-for='customize']"),
      optionsRectangularWrapper: this.element.querySelector(
        ".section_options_section[data-for='customize'] .section_options_all"
      ),
      optionsRectangular: this.element.querySelector(
        ".section_options_section[data-for='customize'] .popup_options_section"
      ),
      popupProgressRectangular: this.element.querySelector("#popup_progress_rectangular"),
      popupColumns: this.element.querySelector("#popup_columns"),
      popupProgressTextPlacement: this.element.querySelector("#popup_progress_text_placement"),
      popupProgressAxis: this.element.querySelector("#popup_progress_axis"),
      popupProgressBarWidth: this.element.querySelector("#popup_progress_width"),
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
        this.updatePreview(dataset);

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
      this.selectedButtonIndex = this.presetCustomButton.dataset.id;
      this.updateSelectedButton();
      this.updateCustomizeSection();
      this.updatePreview(null, true);
    };

    this.custom.popupProgressRectangular.onchange = () => {
      this.handleDisplayRectangularUpdate();
      this.updatePreview(null, true);
    };

    this.custom.popupColumns.onchange = () => {
      this.updatePreview(null, true);
    };

    this.custom.popupProgressTextPlacement.onchange = () => {
      this.updatePreview(null, true);
    };

    this.custom.popupProgressAxis.onchange = () => {
      this.updatePreview(null, true);
    };

    this.custom.popupProgressBarWidth.onchange = () => {
      this.updatePreview(null, true);
    };

    this.custom.element.disable();

    this.presetButtons[this.selectedButtonIndex].click();

    this.handleDisplayRectangularUpdate(false);
  }

  updateValue() {}

  handleDisplayRectangularUpdate(animate = true) {
    this.waitUpdateTimeouts = animatorAnimate({
      parent: this.custom.optionsRectangularWrapper,
      more: this.custom.optionsRectangular,
      enabled: this.custom.popupProgressRectangular.checked,
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

  updateCustomizeSection() {
    // Enable customize section
    this.custom.element.enable();
  }

  async updatePreview(dataset, from_customize = false) {
    let attributes = {};

    if (from_customize) {
      attributes.columns = this.custom.popupColumns.checked ? "2" : "1";

      attributes.progressTextPlacement = this.custom.popupProgressTextPlacement.checked
        ? "inside"
        : "outside";

      if (this.custom.popupProgressRectangular.checked) {
        attributes.progressAxis = this.custom.popupProgressAxis.checked ? "vertical" : "horizontal";
      } else {
        attributes.progressAxis = "circular";
      }

      attributes.progressBarWidth = this.custom.popupProgressBarWidth.checked ? "large" : "thin";
    } else {
      attributes = Object.assign({}, dataset);
    }

    this.preview.element.setAttribute("data-columns", attributes.columns ?? 1);
    this.preview.element.setAttribute(
      "data-progress-text-placement",
      attributes.progressTextPlacement ?? "outside"
    );
    this.preview.element.setAttribute(
      "data-progress-axis",
      attributes.progressAxis ?? "horizontal"
    );
    this.preview.element.setAttribute(
      "data-progress-bar-width",
      attributes.progressBarWidth ?? "large"
    );

    if (attributes.progressAxis == "circular") {
      this.preview.progressBarRectangular.disable();
      this.preview.progressBarCircular.enable();
    } else {
      this.preview.progressBarRectangular.enable();
      this.preview.progressBarCircular.disable();
    }
  }
}
