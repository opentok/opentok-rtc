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
  submit(form) {
    browser.submitForm(form);
  }
  wait(elem, timeout = this.defaultTimeout) {
    browser.$(elem).waitForDisplayed({ timeout: timeout });
  }
  waitForHidden(elem, timeout = this.defaultTimeout) {
    browser.$(elem).waitForDisplayed({ timeout: 3000, reverse: true}); // third param makes it wait for NOT visible
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
    this.wait(selector, 30000);
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
  return $('#initialVideoSwitch');
  }

  goToRoom() {
    this.clickWhenExist('[data-wd=enterbutton]');
  }

  pause(msec) {
    browser.pause(msec);
  }

  acceptTerms(){
    this.clickWhenExist('[data-wd=tos]');
  }

}
module.exports = Page;
