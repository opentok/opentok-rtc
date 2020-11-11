'use strict';

const Page = require('../pages/page');

describe('Home', function () {
  const page = new Page();
  const user = 'userTest';
  const room = 'roomTest';

  before(()=> {
  });

    it('Landing Page : terms and conditions visible', () => {
    page.open();
    page.name.setValue(user);
    page.pause(3000);
    page.goToRoom();
    page.acceptTerms();
    }, 1);

    it('Landing Page : audio Switch visible and clickable', () => {
      page.open();
      page.name.setValue(user);
      page.audioSwitch.click();
    }, 1);

    it('Landing Page : video Switch visible and clickable', () => {
      page.open();
      page.name.setValue(user);
      page.videoSwitch.click();
    }, 1);

        it('Landing Page : creates room', () => {
        page.createRoom(user);
        }, 1);

});
