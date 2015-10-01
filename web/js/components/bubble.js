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

!function(global) {
  'use strict';

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
     'webkitTransitionEnd' : 'transitionend';

  var HORIZONTAL_OFFSET = 10;

  var bubbles = {};

  /*
   * Closes all bubbles clicking outside them
   */
  var onBodyClicked = function() {
    removeGlobalHandlers();
    Object.keys(bubbles).forEach(function(id) {
      bubbles[id].hide();
    });
  };

  var addGlobalHandlers = function() {
    document.body.addEventListener('click', onBodyClicked);
  };

  var removeGlobalHandlers = function() {
    document.body.removeEventListener('click', onBodyClicked);
  };

  /**
   * Bubble constructor
   *
   * @param {String} Id of the element which is associated with the bubble
   */
  var Bubble = function(id) {
    this.container = document.querySelector('.bubble[for="' + id + '"]');
    this.associatedWith = document.getElementById(id);
    this._onHidden = this._onHidden.bind(this);

    // Bubbles consumes 'click' events in order not to be closed automatically
    this.container.addEventListener('click', function(e) {
      e.stopImmediatePropagation();
    });
  };

  Bubble.prototype = {
    show() {
      var bubble = this;

      this.bubbleShown =
        this.bubbleShown || new Promise(function(resolve, reject) {
        var container = bubble.container;

        container.removeEventListener(transEndEventName, bubble._onHidden);
        container.addEventListener(transEndEventName, bubble._onShown);
        container.addEventListener(transEndEventName, function onEnd() {
          container.removeEventListener(transEndEventName, onEnd);
          resolve();
        });

        bubble._takePlace();
        bubble._visible = true;
        setTimeout(function() {
          container.classList.add('show');
        }, 50); // Give the chance to paint the UI element before fading in
      });

      return this.bubbleShown;
    },

    hide() {
      var bubble = this;

      this.bubbleHidden =
        this.bubbleHidden || new Promise(function(resolve, reject) {
        var container = bubble.container;

        container.removeEventListener(transEndEventName, bubble._onShown);
        container.addEventListener(transEndEventName, bubble._onHidden);
        container.addEventListener(transEndEventName, function onEnd() {
          container.removeEventListener(transEndEventName, onEnd);
          bubble.bubbleShown = bubble.bubbleHidden = null;
          resolve();
        });

        setTimeout(function() {
          container.classList.remove('show');
        }, 50); // Give the chance to paint the UI element before fading out
      });

      return this.bubbleHidden;
    },

    _onShown(e) {
      addGlobalHandlers();
    },

    _onHidden(e) {
      e.target.removeEventListener(transEndEventName, this._onHidden);
      this._visible = false;
    },

    set _visible(value) {
      var classList = this.container.classList;
      value ? classList.add('visible') : classList.remove('visible');
    },

    _takePlace() {
      var rectObject = this.associatedWith.getBoundingClientRect();
      var x = rectObject.right + HORIZONTAL_OFFSET;
      var y = rectObject.top - (rectObject.height / 2);

      var container = this.container;
      container.style.left = x + 'px';
      container.style.top = y + 'px';
    }
  };

  global.BubbleFactory = {
    /**
     * Returns the bubble for an UI element.
     *
     * @param {String} Id of the element which is associated with the bubble
     */
    get(id) {
      var instance = bubbles[id];

      if (!instance) {
        instance = bubbles[id] = new Bubble(id);
      }

      return instance;
    }
  };

}(this);
