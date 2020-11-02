/*
 * This factory deals with Bubble UI Elements.
 *
 * What is a Bubble UI Element?
 *
 *  It is a UI element that is displayed to the right to the element with which
 *  is associated, tipically items on the main menu.
 *
 * How it works...
 *
 *  This component provides features like show or hide bubbles and also it
 *  hides automatically them when users click on the app outside bubbles.
 *
 *  E.g:
 *
 *  Javascript:
 *
 *  BubbleFactory.get('addToCall').show();
 *
 *  HTML:
 *
 *  <a id="addToCall" href="#">Click me!</a>
 *
 *  <section class="bubbles">
 *    <!-- The key is the "for" attribute to indicate the association -->
 *    <section for="addToCall" class="bubble">
 *      <div class="bubble-content">
 *        <p>Hi my friend!</p>
 *      </div>
 *    </section>
 *  </section>
 *
 */

!((global) => {
  const transEndEventName = ('WebkitTransition' in document.documentElement.style)
    ? 'webkitTransitionEnd' : 'transitionend';

  const HORIZONTAL_OFFSET = 10;
  const VERTICAL_OFFSET = 4;

  const bubbles = {};

  /*
   * Closes all bubbles clicking outside them
   */
  const onBodyClicked = (evt) => {
    document.body.removeEventListener('click', onBodyClicked);
    Object.keys(bubbles).forEach((id) => {
      const bubble = bubbles[id];
      let { target } = evt;
      if (bubble.associatedWith !== target) {
        // pointer-events is not working on IE so we can receive as target a child of
        // "change layout" item in main menu
        target = HTMLElems.getAncestorByTagName(target, 'a');
        if (bubble.associatedWith !== target) {
          bubble.hide();
        }
      }
    });
  };

  const addGlobalHandlers = () => {
    document.body.addEventListener('click', onBodyClicked);
  };

  /**
   * Bubble constructor
   *
   * @param {String} Id of the element which is associated with the bubble
   */
  const Bubble = function (id) {
    this.container = document.querySelector(`.bubble[for="${id}"]`);
    this.topArrow = this.container.querySelector('.top-arrow');
    this.associatedWith = document.getElementById(id);
    this._onHidden = this._onHidden.bind(this);

    // Bubbles consumes 'click' events in order not to be closed automatically
    this.container.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
    });
  };

  Bubble.prototype = {
    show() {
      const bubble = this;

      this.bubbleShown = this.bubbleShown || new Promise((resolve) => {
        const { container } = bubble;

        container.removeEventListener(transEndEventName, bubble._onHidden);
        container.addEventListener(transEndEventName, bubble._onShown);
        container.addEventListener(transEndEventName, function onEnd() {
          container.removeEventListener(transEndEventName, onEnd);
          resolve();
        });

        bubble._takePlace();
        bubble._visible = true;
        setTimeout(() => {
          container.classList.add('show');
        }, 50); // Give the chance to paint the UI element before fading in
      });

      return this.bubbleShown;
    },

    hide() {
      const bubble = this;

      this.bubbleHidden = this.bubbleHidden || new Promise((resolve) => {
        const { container } = bubble;

        container.removeEventListener(transEndEventName, bubble._onShown);
        container.addEventListener(transEndEventName, bubble._onHidden);
        container.addEventListener(transEndEventName, function onEnd() {
          container.removeEventListener(transEndEventName, onEnd);
          bubble.bubbleShown = null;
          bubble.bubbleHidden = null;
          resolve();
        });

        setTimeout(() => {
          container.classList.remove('show');
        }, 50); // Give the chance to paint the UI element before fading out
      });

      return this.bubbleHidden;
    },

    toggle() {
      const bubble = this;
      return (bubble.bubbleShown) ? bubble.hide() : bubble.show();
    },

    _onShown() {
      addGlobalHandlers();
    },

    _onHidden(e) {
      e.target.removeEventListener(transEndEventName, this._onHidden);
      this._visible = false;
    },

    set _visible(value) {
      const { classList } = this.container;
      value ? classList.add('visible') : classList.remove('visible');
    },

    _takePlace() {
      const rectObject = this.associatedWith.getBoundingClientRect();
      const { container } = this;
      if (this.topArrow) {
        container.style.right = `${window.innerWidth - rectObject.right + 25}px`;
        container.style.top = `${rectObject.bottom + VERTICAL_OFFSET}px`;
      } else {
        container.style.left = `${rectObject.right + HORIZONTAL_OFFSET}px`;
        container.style.top = `${rectObject.top - rectObject.height}px`;
      }
    }
  };

  global.BubbleFactory = {
    /**
     * Returns the bubble for an UI element.
     *
     * @param {String} Id of the element which is associated with the bubble
     */
    get(id) {
      let instance = bubbles[id];

      if (!instance) {
        instance = new Bubble(id);
        bubbles[id] = new Bubble(id);
      }

      return instance;
    }
  };
})(this);
