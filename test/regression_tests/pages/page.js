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
    browser.waitForVisible(elem, timeout);
  }
  waitForHidden(elem) {
    browser.waitForVisible(elem, 20000, true); // third param makes it wait for NOT visible
  }
  click(elem) {
    browser.click(elem);
  }
  clickNonVisible(selector) {
    browser.execute(function (sel) {
      document.querySelector(sel).click();
    }, selector);
  }
  clickWhenExist(selector) {
    browser.waitForExist(selector, 30000);
    browser.waitForVisible(selector, 10000);
    browser.click(selector);
  }
  getBrowserName() {
    return browser.desiredCapabilities.browserName;
  }
  get name() {
    this.wait('[data-wd=username]')
    return browser.element('[data-wd=username]');
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
