var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('LayoutView', () => {
  var instance;

  var controls = {
    video: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'video',
      eventName: 'click',
    },
    audio: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'audio',
      eventName: 'click',
    },
  };

  var options = {
    name: 'xxx',
    type: 'yyy',
    controlElems: controls,
  };

  function getContainer() {
    return document.getElementById('myContainer');
  }

  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/layoutView_spec.html'];
  });

  describe('#init', () => {
    it('should export a init function', () => {
      expect(LayoutView.init).to.exist;
      expect(LayoutView.init).to.be.a('function');
    });

    it('should be initialized', () => {
      LayoutView.init(getContainer());
    });
  });

  describe('#append', () => {
    it('should add items', () => {
      var list = getContainer().querySelector('ul');
      var length = list.children.length;

      var id = Math.random() + '';

      var item = LayoutView.append(id, {
        name: options.name,
        type: options.type,
        controlElems: {},
      });

      expect(item.dataset.id).to.equal(id);
      expect(item.dataset.streamType).to.equal(options.type);
      expect(list.children.length).to.equal(length + 1);

      var nameElement = list.querySelector('.name');
      expect(nameElement).to.exist;
      expect(nameElement.textContent).to.be.equal(options.name);

      var buttons = list.querySelector('.buttons');
      expect(buttons).not.to.exist;

      var dblclickAreaElement = list.querySelector('.dblclick_area');
      expect(dblclickAreaElement).to.exist;
    });

    it('should add publisher with record icon', () => {
      var list = getContainer().querySelector('ul');

      var item = LayoutView.append(Math.random() + '', {
        name: options.name,
        type: 'publisher',
        controlElems: {},
      });

      var record = item.querySelector('[data-icon="record"]');
      expect(record).to.exist;
    });
  });

  describe('#remove', () => {
    it('should delete items', () => {
      var list = getContainer().querySelector('ul');
      var length = list.children.length;
      var item = LayoutView.append(Math.random() + '', options);
      expect(list.children.length).to.be.equal(length + 1);
      LayoutView.remove(item);
      expect(list.children.length).to.be.equal(length);
    });
  });
});
