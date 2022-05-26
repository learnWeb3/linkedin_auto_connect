const { writeFileSync, readFileSync, read, readFile, fstat } = require("fs");
const { join } = require("path");
const Base = require("./src/Base");

const pause = (pauseLengthMs) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, pauseLengthMs);
  });

const loadPageResults = async (scrapper) => {
  // load page results to end of page to circumvent lazy loading;
  await scrapper.loadByCssSelector("div.entity-result__item");
};

const extractPagination = async (scrapper) => {
  await scrapper.loadByCssSelector("div.artdeco-card.pv0.mb6");
  // extract pagination to find out max result page
  const paginationListItems = await scrapper.extractElementsByCssSelector(
    "ul.artdeco-pagination__pages.artdeco-pagination__pages--number li button span",
    {}
  );
  // maxPage is the last element value of the pagination
  const maxPage = paginationListItems[paginationListItems.length - 1].text;
  return maxPage;
};

const connect = async (
  scrapper,
  connectMessage = `Bonjour,\n\nJe suis à la recherche d'une alternance en tant que développeur web éligible à une aide exceptionnelle d'Etat de 8000 euros.\nVoici le lien vers mon portfolio: https://antoine-le-guillou.herokuapp.com/.\nJe vous remercie de votre attention.\n\nCordialement,\nAntoine LE GUILLOU`
) => {
  const connectButtons = await scrapper.extractElementsByCssSelector(
    "div.entity-result__item .entity-result__actions.entity-result__divider div button"
  );

  const filteredConnectButtons = connectButtons.filter(
    ({ text }) => text === "Se connecter"
  );

  for (const filteredConnectButton of filteredConnectButtons) {
    await scrapper.clickOnElement(filteredConnectButton.ref);
    await scrapper._checkElementIsPresent(
      'div[aria-labelledby="send-invite-modal"]',
      2000
    );
    await scrapper._checkElementIsPresent(
      "div.artdeco-modal__actionbar.ember-view.text-align-right",
      2000
    );
    await scrapper._checkElementIsPresent(
      'div.artdeco-modal__actionbar.ember-view.text-align-right button[aria-label="Ajouter une note"]',
      2000
    );
    await scrapper.clickOnElementByCssSelector(
      'div.artdeco-modal__actionbar.ember-view.text-align-right button[aria-label="Ajouter une note"]'
    );
    await scrapper._checkElementIsPresent("textarea#custom-message", 2000);
    await scrapper.fillElementWithText(
      "textarea#custom-message",
      connectMessage
    );
    await scrapper._checkElementIsPresent(
      'button[aria-label="Envoyer maintenant"]',
      2000
    );
    await scrapper.clickOnElementByCssSelector(
      'button[aria-label="Envoyer maintenant"]'
    );
  }
};

const run = async () => {
  // init scrapper
  const AUTH_COOKIE = {
    name: "li_at",
    value:
      "AQEDATNGsFYEhaN-AAABgN0gtD4AAAGBAS04PlYA0Kmihoo0VkeyVUNaBndJIG70tcJSEwYMJgYQW7hwJ8vk3kdKxUMaLohLeqRhJnWj7ahKE8Uasv5f0In5L0gV9Dkacfd846uQ2b0e_aod89TvpHMJ",
  };
  const DOMAIN = "https://www.linkedin.com";
  const BASE_URL = `https://www.linkedin.com/search/results/people/?keywords=CEO%20AND%20web%20AND%20marseille&origin=SWITCH_SEARCH_VERTICAL&sid=pE%3A`;
  const SCRAPPER = new Base(DOMAIN, BASE_URL, AUTH_COOKIE);

  await SCRAPPER.navigate();
  await loadPageResults(SCRAPPER);
  const maxPage = await extractPagination(SCRAPPER).then((value) =>
    parseInt(value)
  );
  
  //await connect(SCRAPPER);

  while (SCRAPPER.page < maxPage) {
    SCRAPPER.nextPage();
    SCRAPPER.changeUrl(BASE_URL + `&page=${SCRAPPER.page}`);
    await SCRAPPER.navigate();
    await loadPageResults(SCRAPPER);
    //await connect(SCRAPPER);
  }
};

run().then(() => process.exit(0));
