var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Grid', function() {

  var instance;

  var controls = {
    video: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'video',
      eventName: 'click'
    },
    audio: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'audio',
      eventName: 'click'
    }
  };

  function getContainer() {
    return document.querySelector('ul');
  }

  function addItems(instance, number) {
    for (var i = 0; i < number; i++) {
      instance.append('myItem' + i, 'camera');
    }
  }

  function checkSizes(width, height) {
    var features = instance.features();
    expect(features.width).to.equal((width - instance._HORIZONTAL_PADDING) + '%');
    expect(features.height).to.equal((height - instance._VERTICAL_PADDING) + '%');
  }

  before(function() {
    window.document.body.innerHTML = window.__html__['test/unit/layout_spec.html'];
  });

  beforeEach(function() {
    document.getElementById('myContainer').innerHTML = '';
    instance = new Grid('div');
  });

  describe('#constructor', function() {
    it('should be initialized properly', function() {
      var container = getContainer();
      expect(instance.container).to.be.container;
      expect(instance.itemType).to.equal('li');
      expect(instance.itemControlType).to.equal('i');
      expect(container.parentNode.classList.contains('tc-list')).to.be.true;
      expect(container.parentNode.classList.contains('grid')).to.be.true;
    });
  });

  describe('#append', function() {
    it('should add items', function() {
      var container = getContainer();
      expect(container.children.length).to.equal(0);
      addItems(instance, 1);
      var item = container.querySelector('li');
      expect(item.dataset.id).to.equal('myItem0');
      expect(container.children.length).to.equal(1);

      var name = container.querySelector('li .name');
      expect(name).to.exist;
    });

    it('should fit one item to the whole container', function() {
      addItems(instance, 1);
      checkSizes(100, 100);
    });

    it('should fit two items to the half of the container width', function() {
      addItems(instance, 2);
      checkSizes(50, 100);
    });

    it('should fit three/four items to the half container height and width',
      function() {
      addItems(instance, 3);
      checkSizes(50, 50);

      addItems(instance, 1);
      checkSizes(50, 50);
    });

    it('should add items with controls', function() {
      var container = getContainer();

      var id = 'myItem';
      instance.append(id, 'camera', controls);

      var item = container.querySelector('li');
      expect(item.dataset.id).to.equal(id);

      var video = container.querySelector('li i[data-icon="video"]');
      expect(video.dataset.icon).to.equal(controls.video.dataIcon);
      expect(video.dataset.eventName).to.equal(controls.video.eventFiredName);
      expect(video.dataset.action).to.equal('video');
      expect(video.dataset.streamId).to.equal(id);
      expect(video.parentNode.classList.contains('enabled')).to.be.true;

      var audio = container.querySelector('li i[data-icon="audio"]');
      expect(audio.dataset.icon).to.equal(controls.audio.dataIcon);
      expect(audio.dataset.eventName).to.equal(controls.audio.eventFiredName);
      expect(audio.dataset.action).to.equal('audio');
      expect(audio.dataset.streamId).to.equal(id);
      expect(audio.parentNode.classList.contains('enabled')).to.be.true;
    });

    it('should show user name', function() {
      var username = 'Pepito';
      var item = instance.append('myItem', 'camera', controls, username);
      var nameElement = getContainer().querySelector('li .name');
      expect(nameElement.textContent).to.equal(username);
    });


    it('should add video control working properly', sinon.test(function(done) {
      var id = 'myItem';
      instance.append(id, 'camera', controls);
      var control = getContainer().querySelector('li i[data-icon="video"]');

      this.stub(window, 'CustomEvent', function(name, data) {
        expect(name).to.equal(controls.video.eventFiredName);
        expect(data.detail.streamId).to.equal(id);
        expect(data.detail.name).to.equal('video');
        CustomEvent.restore();
        done();
      });

      control.click();
      expect(control.classList.contains('enabled')).to.be.false;
    }));

    it('should add audio control working properly', sinon.test(function(done) {
      var id = 'myItem';
      instance.append(id, 'audio', controls);
      var control = getContainer().querySelector('li i[data-icon="audio"]');

      this.stub(window, 'CustomEvent', function(name, data) {
        expect(name).to.equal(controls.audio.eventFiredName);
        expect(data.detail.streamId).to.equal(id);
        expect(data.detail.name).to.equal('audio');
        done();
      });

      control.click();
      expect(control.classList.contains('enabled')).to.be.false;
    }));
  });

  describe('#remove', function() {
    it('should delete items', function() {
      var container = getContainer();
      addItems(instance, 1);
      expect(container.children.length).to.equal(1);
      instance.remove('myItem0');
      expect(container.children.length).to.equal(0);
    });
  });

  describe('#features', function() {
    it('should be called to set sizes', function() {
      addItems(instance, 1);
      var item = getContainer().querySelector('li');
      var features = instance.features();
      expect(features.width).to.equal(item.style.width.replace(',', '.'));
      expect(features.height).to.equal(item.style.height.replace(',', '.'));
    });
  });

  describe('#rearrange', sinon.test(function() {
    it('should be called after addding or removing items', function() {
      sinon.spy(instance, 'rearrange');
      addItems(instance, 1);
      expect(instance.rearrange.calledOnce).to.be.true;
      instance.remove('myItem0');
      expect(instance.rearrange.calledTwice).to.be.true;
    });
  }));

});
