'use strict';


class Page {

  constructor() {
    this.title = '';
  }
  open() {
    browser.url('/');
  }
  submit(form) {
    browser.submitForm(form);
  }
  wait(elem) {
    browser.waitForExist(elem);
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
    browser.waitForExist(selector, 20000);
    browser.click(selector);
  }
  getBrowserName() {
    return browser.desiredCapabilities.browserName;
  }
  get room() {
    if (browser.desiredCapabilities.browserName === 'firefox') {
      browser.pause(100);
    }
    browser.waitForExist('[data-wd=roomname]');
    return browser.element('[data-wd=roomname]');
  }
  get name() {
    return browser.element('[data-wd=username]');
  }
  goToRoom() {
    this.clickWhenExist('#enter');
  }
}
module.exports = Page;
