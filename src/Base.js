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

  changeUrl(newUrl) {
    this.url = newUrl;
  }

  nextPage() {
    this.page = this.page + 1;
  }

  previousPage() {
    if (this.page - 1 < 0) {
      throw new Error("page value can't be less than 0");
    }
    this.page = this.page - 1;
  }

  async clickOnElement(element) {
    await this.driver.executeScript("arguments[0].click();", element);
  }

  async clickOnElementByCssSelector(selector) {
    await this.driver.executeScript(
      "return document.querySelector(`" + `${selector}` + "`).click()"
    );
  }

  async fillElementWithText(selector, text) {
    const element = await this.driver.findElement(
      this.webdriver.By.css(selector)
    );
    await element.sendKeys(text);
  }

  async extractElementsByCssSelector(selector, attributesToExtract = {}) {
    const self = this;
    return await self.driver
      .findElements(this.webdriver.By.css(selector))
      .then(async (elements) => {
        return await Promise.all(
          elements.map(async (element) => {
            const extractedAttributes = {};
            extractedAttributes["ref"] = element;
            extractedAttributes["text"] = await element.getText();
            for (const attributeKey in attributesToExtract) {
              extractedAttributes[attributeKey] = await element.getAttribute(
                attributeKey
              );
            }
            return extractedAttributes;
          })
        );
      });
  }

  async loadByCssSelector(selector) {
    const self = this;
    await self.driver
      .findElements(this.webdriver.By.css(selector))
      .then(
        async (elements) =>
          await Promise.all(
            elements.map(async (element) => element.getAttribute("offsetTop"))
          )
      )
      .then(
        async (elementOffsetTops) =>
          await Promise.all(
            elementOffsetTops.map(
              async (elementOffsetTop) =>
                await self.driver.executeScript(
                  `window.scrollTo({top: ${elementOffsetTop}})`
                )
            )
          )
      );
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

  async navigate() {
    if (this.authenticationCookie) {
      await this._addAuthenticationCookie();
      await this._checkCookieIsPresent(this.authenticationCookie.name);
    }
    await this.driver.get(this.url);
  }

  async extractFromPage(
    targetedSelector,
    extractOptions = {
      text: true,
      href: true,
    }
  ) {
    const html_doc = await this._dumpHTML();
    let $ = cheerio.load(html_doc);
    const elements = Array.from($(targetedSelector));
    return elements.map((e) => {
      const obj = {};
      for (const key in extractOptions) {
        obj[key] =
          key === "text"
            ? $(e).text()
              ? $(e).text().trim()
              : ""
            : $(e).attr(key)
            ? $(e).attr(key).trim()
            : "";
      }
      return obj;
    });
  }
}

module.exports = Base;
