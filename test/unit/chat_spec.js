var expect = chai.expect;

describe('Chat', function() {

  function getContainer() {
    return document.getElementById('chat');
  }

  before(function() {
    window.document.body.innerHTML = window.__html__['test/unit/chat_spec.html'];
  });

  it('should exist', function() {
    expect(Chat).to.exist;
  });

  describe('#init()', function() {
    it('should export a init function', function() {
      expect(Chat.init).to.exist;
      expect(Chat.init).to.be.a('function');
      Chat.init();
    });
  });

  describe('#collapse()', function() {
    it('should collapse the chat', function() {
      Chat.collapse();
      expect(getContainer().classList.contains('collapsed')).to.be.true;
    });
  });

  describe('#expand()', function() {
    it('should expand the chat', function() {
      Chat.expand();
      expect(getContainer().classList.contains('collapsed')).to.be.false;
    });
  });

  describe('#isCollapsed()', function() {
    it('should return true when chat is collapsed otherwise false', function() {
      Chat.collapse();
      expect(Chat.isCollapsed()).to.be.true;
      Chat.expand();
      expect(Chat.isCollapsed()).to.be.false;
    });
  });

  describe('#visible', function() {
    it('should return true when chat is visible otherwise false', function() {
      getContainer().classList.add('visible');
      expect(Chat.visible).to.be.true;
      getContainer().classList.remove('visible');
      expect(Chat.visible).to.be.false;
    });
  });

});
