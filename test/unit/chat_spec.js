var expect = chai.expect;

describe('Chat', () => {
  function getContainer() {
    return document.getElementById('chat');
  }

  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/chat_spec.html'];
  });

  it('should exist', () => {
    expect(Chat).to.exist;
  });

  describe('#init()', () => {
    it('should export a init function', () => {
      expect(Chat.init).to.exist;
      expect(Chat.init).to.be.a('function');
      Chat.init();
    });
  });

  describe('#collapse()', () => {
    it('should collapse the chat', () => {
      Chat.collapse();
      expect(getContainer().classList.contains('collapsed')).to.be.true;
    });
  });

  describe('#expand()', () => {
    it('should expand the chat', () => {
      Chat.expand();
      expect(getContainer().classList.contains('collapsed')).to.be.false;
    });
  });

  describe('#isCollapsed()', () => {
    it('should return true when chat is collapsed otherwise false', () => {
      Chat.collapse();
      expect(Chat.isCollapsed()).to.be.true;
      Chat.expand();
      expect(Chat.isCollapsed()).to.be.false;
    });
  });

  describe('#visible', () => {
    it('should return true when chat is visible otherwise false', () => {
      getContainer().classList.add('visible');
      expect(Chat.visible).to.be.true;
      getContainer().classList.remove('visible');
      expect(Chat.visible).to.be.false;
    });
  });
});
