class Validator {
  static number(input, e, options_passed = {}) {
    let options = {
      negative: options_passed.negative ?? false,
      min: options_passed.min ?? null,
      max: options_passed.max ?? null,
    };

    let char_code = e.data;

    // If deleting characters
    if (char_code == null) {
      return this.validate(input, options.min, options.max);
    }

    // Any digit or minus letters
    let any_char = char_code.match(/[\d\-]/);
    if (any_char == null) {
      e.preventDefault();
      return this.validate(input, options.min, options.max);
    }

    if (e.inputType == "insertReplacementText") {
      input.value = char_code;
    }

    //If negative numbers are accepted
    if (char_code == "-") {
      // If don't want negative numbers don't let that be typed
      if (!options.negative) {
        e.preventDefault();
      }

      if (input.value.match(/-/) != null) {
        e.preventDefault();
        return this.validate(input, options.min, options.max);
      }
    }

    return this.validate(input, options.min, options.max);

    // // If has a min limiter
    // if (options.min) {
    //   if (input.value < options.min) {
    //     e.preventDefault();
    //     console.log("Limit MIN");
    //   }
    // }

    // // If has a max limiter
    // if (options.max) {
    //   if (input.value > options.max) {
    //     e.preventDefault();
    //     console.log("Limit MAX");
    //   }
    // }
  }

  static validate(input, min, max) {
    if (
      input.value == "" ||
      (min != null && input.value < min) ||
      (max != null && input.value > max)
    ) {
      input.classList.add("input_error");
      return false;
    } else {
      input.classList.remove("input_error");
      return true;
    }
  }
}
