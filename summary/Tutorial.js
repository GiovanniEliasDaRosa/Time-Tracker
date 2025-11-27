class Tutorial {
  constructor() {
    this.element = document.querySelector("#tutorial");
    this.element.enable();

    this.highlighter = this.element.querySelector(".tutorial_highlighter");
    this.lastHighlight = null;

    let popup = this.element.querySelector(".tutorial_popup");

    this.popup = {
      element: popup,
      title: popup.querySelector(".tutorial_popup_text_title"),
      currentStep: popup.querySelector(".tutorial_popup_text_current_step"),
      description: popup.querySelector(".tutorial_popup_text_description"),
    };

    let popup_buttons = popup.querySelector(".tutorial_popup_buttons");

    this.popupButtons = {
      previous: popup_buttons.querySelector(".button_previous"),
      cancel: popup_buttons.querySelector(".button_cancel"),
      skip: popup_buttons.querySelector(".button_skip"),
      next: popup_buttons.querySelector(".button_next"),
    };

    this.popupButtons.cancel.disable();

    this.skipConfirm = false;
    this.skipTimeout = "";

    this.updateHighlightTimeout = "";

    this.popupButtons.previous.onclick = () => {
      if (this.currentStep > 0) {
        this.currentStep--;
      }
      this.updateStep();
    };

    this.popupButtons.cancel.onclick = () => {
      clearTimeout(this.skipTimeout);
      this.popupButtons.skip.classList.remove("wait_skip");
      this.skipConfirm = false;

      this.popupButtons.previous.enable();
      this.popupButtons.cancel.disable();
      this.popupButtons.skip.enable();
      this.popupButtons.next.enable();

      this.updateStep();
    };

    this.popupButtons.skip.onclick = () => {
      this.skipTutorial();
    };

    this.popupButtons.next.onclick = () => {
      this.currentStep++;

      this.updateStep();
    };

    this.currentStep = 0;

    this.steps = [
      {
        title: `Welcome to Time Tracker!`,
        text: `See how much time you spend and where.`,
        highlight: null,
      },
      {
        title: `How to get to this page`,
        text: `Click the extension icon to open the popup, then click inside it to open this page.
|Tip: The popup shows a quick view of today's time.|`,
        highlight: null,
      },
      {
        title: `This is the Summary Page`,
        text: `It's a dashboard for the time spent by site.`,
        highlight: null,
      },
      {
        title: `Daily section`,
        text: `Shows your time spent by domain for the selected day.
|Tip: The top 10 domains are shown by default, and if you visited more than 10 sites that day, a "Show more" button appears.|`,
        highlight: document.querySelector(".timer"),
      },
      {
        title: `Options page`,
        text: `This is where you can customize your experience while using the extension.`,
        highlight: document.querySelector("#configurations_button"),
      },
    ];

    this.updateStep();

    window.onresize = () => {
      clearTimeout(this.updateHighlightTimeout);
      this.updateHighlight();

      this.updateHighlightTimeout = setTimeout(() => {
        this.updateHighlight();
      }, 100);
    };

    this.popup.element.classList.add("popup_animate_in");

    document.body.style.overflow = "hidden";
  }

  updateStep() {
    if (this.currentStep > this.steps.length - 1) {
      this.tutorialComplete();
      return;
    }

    let selected = this.steps[this.currentStep];

    this.popup.currentStep.innerText = `${this.currentStep + 1}/${this.steps.length}`;
    this.updateText(selected.title, selected.text);

    if (selected.highlight != null) {
      this.highlightTarget(selected.highlight);
      this.element.setAttribute("data-selectable", "true");
    } else {
      this.highlighter.disable();
      this.element.setAttribute("data-selectable", "false");
    }
  }

  updateText(title, text) {
    this.popup.title.innerText = title;

    let text_by_line = text.split("\n");
    this.popup.description.innerText = "";

    text_by_line.forEach((text) => {
      let span = document.createElement("p");
      let has_tip = text.match(/^\|(.+?)\|$/m);
      if (has_tip == null) {
        span.innerText = text;
      } else {
        span.classList.add("tutorial_popup_text_description_tip");
        span.innerText = has_tip[1];
      }

      this.popup.description.appendChild(span);
    });
  }

  skipTutorial() {
    // Really skip
    if (this.skipConfirm) {
      this.popupButtons.previous.disable(false);
      this.popupButtons.cancel.disable(false);
      this.popupButtons.next.disable(false);
      this.popupButtons.skip.disable(false);
      this.skipConfirm = false;
      this.tutorialComplete(false);

      this.element.setAttribute("data-selectable", "false");
      return;
    }

    this.updateText(
      `Skip tutorial?`,
      `You can restart the tutorial anytime by going to:
|Options page > Tutorial > Start tutorial|`
    );
    this.popup.currentStep.innerText = `${this.steps.length}/${this.steps.length}`;

    this.highlightTarget(document.querySelector("#configurations_button"));

    this.popupButtons.previous.disable(false);
    this.popupButtons.cancel.enable();
    this.popupButtons.next.disable(false);

    // Visually the button has a 2.5 seconds cooldown
    clearTimeout(this.skipTimeout);
    this.popupButtons.skip.classList.remove("wait_skip");

    this.popupButtons.skip.classList.add("wait_skip");
    this.popupButtons.skip.disable(false);

    this.skipConfirm = true;

    this.element.setAttribute("data-selectable", "true");

    this.skipTimeout = setTimeout(() => {
      this.popupButtons.skip.classList.remove("wait_skip");
      this.popupButtons.skip.enable();
    }, 1000);
  }

  highlightTarget(target) {
    if (this.lastHighlight) {
      this.lastHighlight.style.zIndex = "";
    }

    target.focus();

    let target_bounds = target.getBoundingClientRect();
    let target_styles = window.getComputedStyle(target);
    let target_border_radius = Number(target_styles.borderRadius.replace(/\D/, "")[0]) + 4;

    this.highlighter.enable();
    this.highlighter.style.left = `${target_bounds.left}px`;
    this.highlighter.style.top = `${target_bounds.top}px`;
    this.highlighter.style.width = `${target_bounds.width}px`;
    this.highlighter.style.height = `${target_bounds.height}px`;
    this.highlighter.style.borderRadius = `${target_border_radius}px`;
    target.style.zIndex = "100";

    this.lastHighlight = target;
  }

  updateHighlight() {
    if (this.skipConfirm) {
      this.highlightTarget(document.querySelector("#configurations_button"));
    } else {
      let selected = this.steps[this.currentStep];

      if (selected.highlight != null) {
        this.highlightTarget(selected.highlight);
      }
    }
  }

  async tutorialComplete(message = true) {
    window.location.hash = "";

    this.popup.element.classList.remove("popup_animate_in");

    this.popupButtons.previous.disable(false);
    this.popupButtons.next.disable(false);
    this.popupButtons.skip.disable(false);

    this.highlighter.style.opacity = "1";
    this.highlighter.style.transition = "opacity 1.5s linear";

    if (message) {
      this.popup.element.setAttribute("data-finished", "true");

      this.updateText("Tutorial completed", "Enjoy the extension!");
      this.highlighter.style.transition = "opacity 2s linear";

      await wait(500);

      this.highlighter.style.opacity = "0";

      await wait(1500);
    }

    document.body.style.overflow = "clip";

    this.popup.element.classList.add("popup_animate_out");

    this.highlighter.style.opacity = "0";

    await wait(2000);

    document.body.style.overflow = "";

    this.element.disable();
    this.element.remove();
  }
}
