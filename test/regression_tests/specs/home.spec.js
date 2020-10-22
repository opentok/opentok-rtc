'use strict';

const Page = require('../pages/page');

describe('Home', function () {
  const page = new Page();
  const user = 'userTest';
  const room = 'roomTest';

  before(()=> {
  });

  it('creates room', () => {
    page.open();
    page.name.setValue(user);
    page.goToRoom();
    page.acceptTerms();
  }, 1);

});
