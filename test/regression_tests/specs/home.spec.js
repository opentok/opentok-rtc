'use strict';

const Page = require('../pages/page');

describe('Home', function () {
  const page = new Page();
  const user = 'userTest';
  const room = 'roomTest';

  before(()=> {
  });

    it('Landing Page : creates room', () => {
    page.open();
    page.name.setValue(user);
    page.goToRoom();
    page.acceptTerms();
    }, 1);

    it('Landing Page : audio Switch visible', () => {
      page.open();
      page.name.setValue(user);
      page.audioSwitch.click();
    }, 1);

});
