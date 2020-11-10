var { expect } = chai;

describe('Chat', () => {
  function getContainer() {
    return document.getElementById('chat');
  }

  beforeAll(() => {
    window.document.body.innerHTML = window.__html__['test/unit/chat_spec.html'];
  });

  it('should exist', () => {
    expect(Chat).toBeDefined();
  });

  describe('#init()', () => {
    it('should export a init function', () => {
      expect(Chat.init).toBeDefined();
      expect(Chat.init).toBeInstanceOf(Function);
      Chat.init();
    });
  });

  describe('#collapse()', () => {
    it('should collapse the chat', () => {
      Chat.collapse();
      expect(getContainer().classList.contains('collapsed')).toBe(true);
    });
  });

  describe('#expand()', () => {
    it('should expand the chat', () => {
      Chat.expand();
      expect(getContainer().classList.contains('collapsed')).toBe(false);
    });
  });

  describe('#isCollapsed()', () => {
    it('should return true when chat is collapsed otherwise false', () => {
      Chat.collapse();
      expect(Chat.isCollapsed()).toBe(true);
      Chat.expand();
      expect(Chat.isCollapsed()).toBe(false);
    });
  });

  describe('#visible', () => {
    it('should return true when chat is visible otherwise false', () => {
      getContainer().classList.add('visible');
      expect(Chat.visible).toBe(true);
      getContainer().classList.remove('visible');
      expect(Chat.visible).toBe(false);
    });
  });
});
