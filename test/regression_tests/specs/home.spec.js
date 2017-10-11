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
    page.room.setValue(room);
    page.name.setValue(user);
    page.goToRoom();
  }, 1);

});
