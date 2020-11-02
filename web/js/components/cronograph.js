!((exports) => {
  let cronographElement;
  let counter = 0;
  let counterTimer = null;

  function beautify(value) {
    return (value < 10) ? (`0${value}`) : value;
  }

  function reset(text) {
    counter = 0;
    cronographElement && paint(text);
  }

  function paint(text) {
    if (!text) {
      const minutes = Math.floor(counter / 60);
      const seconds = Math.floor(counter % 60);
      text = `${beautify(minutes)}:${beautify(seconds)}`;
    }

    cronographElement.textContent = text;
  }

  const Cronograph = {
    /**
     * It initializes the cronograph.
     *
     * {initialText} Optional text which will be displayed before starting.
     */
    init(initialText) {
      cronographElement = document.querySelector('.duration');
      reset(initialText);
      return this;
    },

    /**
     * It starts the cronograph from 0 by default.
     *
     * {from} This param sets the seconds from where the cronograph will start
     *        counting.
     */
    start(from) {
      if (counterTimer !== null) {
        return this;
      }
      counter = Math.max(from || 0, 0);
      counterTimer = setInterval(() => {
        ++counter;
        paint();
      }, 1000);
      return this;
    },

    stop() {
      exports.clearInterval(counterTimer);
      counterTimer = null;
      return this;
    },

    reset
  };

  exports.Cronograph = Cronograph;
})(this);
