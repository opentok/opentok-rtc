'use strict';


class Page {

  constructor() {
    this.title = '';
    this.defaultTimeout = 30 * 1000; // 30 seconds
    this.externalServiceTimeout = 2 * 60 * 1000; // 2 min
    this.defaultPauseTime = 5 * 1000; // 5 seconds
  }
  open() {
    browser.url('/');
  }

    openThanksPage() {
      browser.url('/thanks');
    }
  submit(form) {
    browser.submitForm(form);
  }
  wait(elem, timeout = this.defaultTimeout) {
    browser.$(elem).waitForDisplayed({ timeout: timeout });
  }
  waitForHidden(elem, timeout = this.defaultTimeout) {
    browser.$(elem).waitForDisplayed({ timeout: timeout, reverse: true}); // third param makes it wait for NOT visible
  }
  click(elem) {
      browser.$(elem).click();
  }
  clickNonVisible(selector) {
    browser.execute(function (sel) {
      document.querySelector(sel).click();
    }, selector);
  }
  clickWhenExist(selector) {
    this.wait(selector, 40000);
    browser.$(selector).click();
  }
  getBrowserName() {
    return browser.desiredCapabilities.browserName;
  }
  get name() {
    this.wait('[data-wd=username]')
    return browser.$('[data-wd=username]');
  }

  get audioSwitch() {
  return $('#initialAudioSwitch');
  }

    get videoSwitch() {
    return $('#initialVideoSwitch');
    }

    get roomVideoSwitch() {
      return $('#toggle-publisher-video');
    }

    get roomAudioSwitch() {
      return $('#toggle-publisher-audio');
    }

    get roomScreenShareSwitch() {
      return $('#toggle-publisher-audio');
    }

    get roomAnnotationswitch() {
      return $('#toggle-publisher-audio');
    }
    get roomChatSwitch() {
      return $('#toggle-publisher-audio');
    }

    get leaveMeeting() {
    return $('#endCall');
    }

    get acceptCookies() {
    return $('.accept-cookies-button');
    }

    get startNewMeetingbutton() {
      return $('[data-wd=newMeetingBtn]')
    }


 showCallControls(){
   browser.execute(()=> {
   document.querySelector('.call-controls').classList.add("visible")
   })
 }



  goToRoom() {
    this.clickWhenExist('[data-wd=enterbutton]');
  }



  get inviteButton() {

  return $('#addToCall')
  }

  pause(msec) {
    browser.pause(msec);
  }

  acceptTerms(){
    this.clickWhenExist('[data-wd=tos]');
  }

  createRoom(user){
      this.open();
      this.name.setValue(user);
      this.pause(3000);
      this.goToRoom();
      this.pause(1000);
      this.acceptTerms();
      this.pause(3000);
  }

}
module.exports = Page;
