/* global BubbleFactory */

!(exports => {
  let menu = null;
  let items = null;

  const addHandlers = () => {
    menu.addEventListener('click', evt => {
      const type = evt.target.data('layoutType');
      if (type) {
        BubbleFactory.get('chooseLayout').toggle();
        Utils.sendEvent('layoutMenuView:layout', {
          type
        });
      }
    });

    window.addEventListener('layoutManager:availableLayouts', evt => {
      const availableLayouts = evt.detail.layouts;

      Array.prototype.map.call(items, elem => {
        const layoutType = elem.data('layoutType');
        const isAvailable = !!availableLayouts[layoutType];
        elem.disabled = !isAvailable;
        isAvailable ? elem.removeAttribute('disabled') : elem.setAttribute('disabled', 'disabled');
      });
    });
  };

  const init = () => {
    menu = document.querySelector('[for="chooseLayout"] ul');
    items = menu.querySelectorAll('a');
    addHandlers();
  };

  exports.LayoutMenuView = {
    init
  };
})(this);
