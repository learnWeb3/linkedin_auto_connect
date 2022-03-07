const webdriver = require("selenium-webdriver");
const cheerio = require("cheerio");
const { join } = require("path");
const { ServiceBuilder } = require("selenium-webdriver/chrome");

class Base {
  constructor(domain, url, authenticationCookie = null) {
    this.webdriver = webdriver;
    this.serviceBuilder = new ServiceBuilder(
      join(process.cwd(), "src", "drivers", "chromedriver")
    );
    this.driver = new this.webdriver.Builder()
      .forBrowser("chrome")
      .setChromeService(this.serviceBuilder)
      .build();
    this.domain = domain;
    this.page = 1;
    this.url = url;
    this.authenticationCookie = authenticationCookie;
  }

  async _checkElementIsPresent(selector, timeout) {
    return await this.driver
      .wait(
        this.webdriver.until.elementLocated(this.webdriver.By.css(selector)),
        timeout,
        "timed out"
      )
      .then(async (element) => true)
      .catch((error) => false);
  }

  async _checkCookieIsPresent(cookieKey) {
    // read the cookie
    try {
      await this.driver
        .manage()
        .getCookie(cookieKey)
        .then(function (cookie) {
          return cookie;
        });
    } catch (error) {
      console.log("Error while retrieving authentication cookie");
      await this.driver.quit();
    }
  }

  async _addAuthenticationCookie() {
    if (this.authenticationCookie) {
      await this.driver.get(this.domain);
      await this.driver.manage().addCookie(this.authenticationCookie);
      return this.driver;
    } else {
      throw new Error("Authenticatioon cookie has not been set");
    }
  }

  async _dumpHTML() {
    const self = this;
    const html_doc = await self.driver.executeScript(
      "return document.documentElement.outerHTML"
    );
    return html_doc;
  }

  _nextPage() {
    this.page = this.page + 1;
  }
  _previousPage() {
    this.page = this.page - 1;
  }

  async navigate() {
    await this.driver.get(this.url);
  }

  async extractFromPage(
    targetedSelector,
    extractOptions = {
      text: true,
      href: true,
    }
  ) {
    const cheerio = require("cheerio");
    const html_doc = await this._dumpHTML();
    let $ = cheerio.load(html_doc);
    const elements = Array.from($(targetedSelector));
    return elements.map((e) => {
      const obj = {};
      for (const key in extractOptions) {
        obj[key] = key === "text" ?  $(e).text() ? $(e).text().trim() : "" :  $(e).attr(key) ? $(e).attr(key).trim() : "";
      }
      return obj;
    });
  }
}

module.exports = Base;
