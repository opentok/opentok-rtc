'use strict';

const Page = require('../pages/page');


describe('Thanks Page', function () {
  const room = new Page();
  const user = 'userRoomTest';

  before(()=> {
  });


        it('Room : Leave Meeting', () => {
        room.open();
        room.name.setValue(user);
        room.pause(3000);
        room.audioSwitch.click();
        room.goToRoom();
        room.pause(1000);
        room.acceptTerms();
        room.pause(3000);
        room.acceptCookies.click();
        room.pause(4000);
        room.leaveMeeting.click();
        });

  });