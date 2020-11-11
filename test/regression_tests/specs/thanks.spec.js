'use strict';

const Page = require('../pages/page');


describe('Thanks Page', function () {
  const room = new Page();
  const user = 'userRoomTest';

  before(()=> {
  });
        it('Thankspage : load thanks page & check new Meeting Button', () => {
         room.openThanksPage();
         room.pause(3000);
         room.startNewMeetingbutton.isExisting();
        });

        it('Thankspage : thanks page to pre call view of Room', () => {
         room.openThanksPage();
         room.pause(3000);
         room.startNewMeetingbutton.isExisting();
         room.startNewMeetingbutton.click();
        });

      it('Thankspage : thanks page to  starting a Room', () => {
         room.openThanksPage();
         room.pause(3000);
         room.startNewMeetingbutton.isExisting();
         room.startNewMeetingbutton.click();
           room.name.setValue(user);
           room.pause(3000);
           room.goToRoom();
           room.pause(1000);
           room.acceptTerms();
           room.pause(3000);
        });

  });