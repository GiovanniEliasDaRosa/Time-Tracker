class Tutorial {
  constructor() {
    this.element = document.querySelector("#tutorial");
    this.element.enable();

    this.main = document.querySelector("main");

    // The highlight, the focus that make everything else dark except the target
    this.highlighter = this.element.querySelector(".tutorial_highlighter");
    this.lastHighlight = null;
    this.updateHighlightTimeout = "";

    // Popup that shows up explaining
    let popup = this.element.querySelector(".tutorial_popup");
    this.popup = {
      element: popup,
      title: popup.querySelector(".tutorial_popup_text_title"),
      currentStep: popup.querySelector(".tutorial_popup_text_current_step"),
      description: popup.querySelector(".tutorial_popup_text_description"),
    };

    // Popup buttons previous/cancel/skip/next
    let popup_buttons = popup.querySelector(".tutorial_popup_buttons");
    this.popupButtons = {
      element: popup_buttons,
      previous: popup_buttons.querySelector(".button_previous"),
      cancel: popup_buttons.querySelector(".button_cancel"),
      skip: popup_buttons.querySelector(".button_skip"),
      next: popup_buttons.querySelector(".button_next"),
    };

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
    this.popupButtons.cancel.disable();

    this.skipConfirm = false;
    this.skipTimeout = "";

    // Steps
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
        text: `This is where you can customize your experience while using the extension.
You can restart the tutorial anytime by going to:
|Options page > Tutorial > Start tutorial|`,
        highlight: document.querySelector("#configurations_button"),
      },
    ];

    window.onresize = () => {
      clearTimeout(this.updateHighlightTimeout);
      this.updateHighlight();

      this.updateHighlightTimeout = setTimeout(() => {
        this.updateHighlight();
      }, 100);
    };

    this.popup.element.classList.add("popup_animate_in");

    // Disable clicking or focusing on elements on the main while in the tutorial
    this.main.disable({ hide: false, lookDisabled: false });
    let interactables = Array.from(this.main.querySelectorAll("button, input, a"));

    interactables.forEach((interactable) => {
      if (interactable.hasAttribute("disabled")) {
        interactable.setAttribute("data-disabled", "true");
      } else {
        interactable.disable({ hide: false, lookDisabled: false });
      }
    });

    document.body.style.overflow = "hidden";

    this.updateStep();
  }

  updateStep() {
    // If on last step
    if (this.currentStep > this.steps.length - 1) {
      this.tutorialComplete();
      return;
    }

    let selected = this.steps[this.currentStep];

    this.popup.currentStep.innerText = `${this.currentStep + 1}/${this.steps.length}`;
    this.updateText(selected.title, selected.text);
    this.popupButtons.element.removeAttribute("data-skip-tutorial");

    // If selected has a targed
    if (selected.highlight != null) {
      this.highlightTarget(selected.highlight);
      this.element.setAttribute("data-selectable", "true");
    } else {
      // If selected doesn't have a targed
      this.highlighter.disable();
      this.element.setAttribute("data-selectable", "false");
    }
  }

  updateText(title, text) {
    // If has a last target, remove the previously set z-index
    if (this.lastHighlight) {
      this.lastHighlight.style.zIndex = "";
    }

    this.popup.title.innerText = title;

    let text_by_line = text.split("\n");
    this.popup.description.innerText = "";

    text_by_line.forEach((text) => {
      let span = document.createElement("p");

      // Check for tips, Check for start and end of the line be "|", a pipe
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
    // Check if it's the second time pressing the button, like a confirmation that you really want to skip it
    if (this.skipConfirm) {
      this.popupButtons.previous.disable({ hide: false });
      this.popupButtons.cancel.disable({ hide: false });
      this.popupButtons.next.disable({ hide: false });
      this.popupButtons.skip.disable({ hide: false });
      this.skipConfirm = false;
      this.tutorialComplete(false);
      return;
    }

    this.updateText(
      `Skip tutorial?`,
      `You can restart the tutorial anytime by going to:
|Options page > Tutorial > Start tutorial|`
    );
    this.popup.currentStep.innerText = `${this.steps.length}/${this.steps.length}`;

    this.highlightTarget(document.querySelector("#configurations_button"));

    this.popupButtons.previous.disable({ hide: false });
    this.popupButtons.cancel.enable();
    this.popupButtons.next.disable({ hide: false });

    // Visually the button has a 1 second cooldown
    clearTimeout(this.skipTimeout);
    this.popupButtons.skip.classList.remove("wait_skip");

    this.popupButtons.skip.classList.add("wait_skip");
    this.popupButtons.skip.disable({ hide: false });

    this.skipConfirm = true;

    this.element.setAttribute("data-selectable", "true");
    this.popupButtons.element.setAttribute("data-skip-tutorial", "true");

    // Visually the button has a 1 second cooldown
    this.skipTimeout = setTimeout(() => {
      this.popupButtons.skip.classList.remove("wait_skip");
      this.popupButtons.skip.enable();
    }, 1000);
  }

  highlightTarget(target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });

    let target_bounds = target.getBoundingClientRect();
    let target_styles = window.getComputedStyle(target);
    let target_border_radius = Number(target_styles.borderRadius.replace(/\D/, "")[0]) + 4;

    this.highlighter.enable();
    this.highlighter.style.left = `${target_bounds.left}px`;
    this.highlighter.style.top = `${target_bounds.top + window.scrollY}px`;
    this.highlighter.style.width = `${target_bounds.width}px`;
    this.highlighter.style.height = `${target_bounds.height}px`;
    this.highlighter.style.borderRadius = `${target_border_radius}px`;
    target.style.zIndex = "100";

    this.lastHighlight = target;
  }

  updateHighlight() {
    // Check if the user is in the confirm skip tutorial
    if (this.skipConfirm) {
      this.highlightTarget(document.querySelector("#configurations_button"));
    } else {
      // The user is following the tutorial normally

      let selected = this.steps[this.currentStep];
      if (selected.highlight != null) {
        this.highlightTarget(selected.highlight);
      }
    }
  }

  async tutorialComplete(message = true) {
    window.location.hash = "";

    // Enable clicking or focusing on elements on the main
    this.main.enable(false);
    let interactables = Array.from(this.main.querySelectorAll("button, input, a"));

    interactables.forEach((interactable) => {
      if (!interactable.hasAttribute("data-disabled")) {
        interactable.enable();
      }
    });

    this.popup.element.classList.remove("popup_animate_in");

    this.popupButtons.previous.disable({ hide: false });
    this.popupButtons.next.disable({ hide: false });
    this.popupButtons.skip.disable({ hide: false });

    this.highlighter.style.opacity = "1";
    this.highlighter.style.transition = "opacity 1.5s linear";

    // If want to show a message saying that the tutorial was complete
    // Will not show message if skipped tutorial
    if (message) {
      this.popup.element.setAttribute("data-finished", "true");

      this.updateText("Tutorial completed", "Enjoy the extension!");
      this.highlighter.style.transition = "opacity 2s linear";

      await wait(500);

      this.highlighter.style.opacity = "0";

      await wait(1500);
    }

    this.popup.element.classList.add("popup_animate_out");

    this.highlighter.style.opacity = "0";

    await wait(2000);

    document.body.style.overflow = "";

    this.element.disable();
    this.element.remove();
  }
}
