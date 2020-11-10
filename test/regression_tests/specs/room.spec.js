'use strict';

const Page = require('../pages/page');

describe('Room Page', function () {
  const room = new Page();
  const user = 'userRoomTest';

  before(()=> {

  });

        it('Room : Publisher Video Element Exist', () => {
        room.createRoom(user);
        room.clickWhenExist('[data-id=publisher]')
        }, 1);

        it('Room : invite popup visible', () => {
        room.createRoom(user);
        room.clickWhenExist('[data-id=publisher]');
        room.inviteButton.click();

        });

        it('Room : verify audio disable works ', () => {
        room.open();
        room.name.setValue(user);
        room.pause(3000);
        room.audioSwitch.click();
        room.goToRoom();
        room.pause(1000);
        room.acceptTerms();
        room.pause(3000);
        room.inviteButton.click();
        room.pause(3000);
        room.roomAudioSwitch.isExisting();
        room.roomVideoSwitch.isExisting();
        room.roomScreenShareSwitch.isExisting();
        room.roomAnnotationswitch.isExisting();
        room.roomChatSwitch.isExisting();
        });

  });