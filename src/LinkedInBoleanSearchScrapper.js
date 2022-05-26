const Base = require("../src/Base");

class LinkedInBoleanSearchScrapper {
  constructor(
    authenticationToken,
    searchUrl,
    connectMessage,
    maxAutoConnect = 10,
    autoConnect = true,
    sendMessageAutoConnect = true
  ) {
    this.searchUrl = searchUrl;
    this.authenticationToken = authenticationToken;
    this.connectMessage = connectMessage;
    this.maxAutoConnect = maxAutoConnect;
    this.autoConnect = autoConnect;
    this.sendMessageAutoConnect = sendMessageAutoConnect;

    this.currentAutoConnect = 0;
    this.srapper = null;
  }

  async loadPageResults() {
    // load page results to end of page to circumvent lazy loading;
    await this.scrapper.loadByCssSelector("div.entity-result__item");
  }

  async extractPagination() {
    await this.scrapper.loadByCssSelector("div.artdeco-card.pv0.mb6");
    // extract pagination to find out max result page
    const paginationListItems =
      await this.scrapper.extractElementsByCssSelector(
        "ul.artdeco-pagination__pages.artdeco-pagination__pages--number li button span",
        {}
      );
    // maxPage is the last element value of the pagination
    const maxPage = paginationListItems[paginationListItems.length - 1].text;
    return maxPage;
  }

  async connect() {
    const connectButtons = await this.scrapper.extractElementsByCssSelector(
      "div.entity-result__item .entity-result__actions.entity-result__divider div button"
    );

    const filteredConnectButtons = connectButtons.filter(
      ({ text }) => text === "Se connecter"
    );

    for (const filteredConnectButton of filteredConnectButtons) {
      await this.scrapper.clickOnElement(filteredConnectButton.ref);
      await this.scrapper._checkElementIsPresent(
        'div[aria-labelledby="send-invite-modal"]',
        2000
      );
      await this.scrapper._checkElementIsPresent(
        "div.artdeco-modal__actionbar.ember-view.text-align-right",
        2000
      );
      await this.scrapper._checkElementIsPresent(
        'div.artdeco-modal__actionbar.ember-view.text-align-right button[aria-label="Ajouter une note"]',
        2000
      );
      await this.scrapper.clickOnElementByCssSelector(
        'div.artdeco-modal__actionbar.ember-view.text-align-right button[aria-label="Ajouter une note"]'
      );
      await this.scrapper._checkElementIsPresent(
        "textarea#custom-message",
        2000
      );
      await this.scrapper.fillElementWithText(
        "textarea#custom-message",
        this.connectMessage
      );
      await this.scrapper._checkElementIsPresent(
        'button[aria-label="Envoyer maintenant"]',
        2000
      );
      this.sendMessageAutoConnect &&
        (await this.scrapper.clickOnElementByCssSelector(
          'button[aria-label="Envoyer maintenant"]'
        ));
    }
  }

  incrementCurrentAutoConnect() {
    this.currentAutoConnect = this.currentAutoConnect + 1;
  }

  async kill() {
    await this.scrapper.driver.quit();
  }

  async run() {
    // init scrapper
    const AUTH_COOKIE = {
      name: "li_at",
      value: this.authenticationToken,
    };
    const DOMAIN = "https://www.linkedin.com";
    const BASE_URL = this.searchUrl;
    this.scrapper = new Base(DOMAIN, BASE_URL, AUTH_COOKIE);

    await this.scrapper.navigate();
    await this.loadPageResults();

    const maxPage = await this.extractPagination().then((value) =>
      parseInt(value)
    );

    if (this.autoConnect && this.currentAutoConnect < this.maxAutoConnect) {
      await this.connect();
      this.incrementCurrentAutoConnect();
    }

    while (
      this.scrapper.page < maxPage &&
      this.currentAutoConnect < this.maxAutoConnect
    ) {
      console.log(this.currentAutoConnect, this.maxAutoConnect)
      this.scrapper.nextPage();
      this.scrapper.changeUrl(BASE_URL + `&page=${this.scrapper.page}`);
      await this.scrapper.navigate();
      await this.loadPageResults();

      if (this.autoConnect && this.currentAutoConnect < this.maxAutoConnect) {
        await this.connect();
        this.incrementCurrentAutoConnect();
      }
    }
  }
}

module.exports = LinkedInBoleanSearchScrapper;
