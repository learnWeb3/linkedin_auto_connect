const { writeFileSync } = require("fs");
const { join } = require("path");
const Base = require("./src/Base");

const pause = (pauseLengthMs) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, pauseLengthMs);
  });

const run = async () => {
  const BASE_URL = "https://www.annuaire-des-mairies.com/";
  const SCRAPPER = new Base("www.annuaire-des-mairies.com", BASE_URL);
  await SCRAPPER.navigate();
  const departements = await SCRAPPER.extractFromPage(
    ".table.table-border.table-mobile.mobile-primary.bg-white a.lientxt"
  );
  const departementWithTownShips = [];
  for (let i = 0; i < departements.length; i++) {
    //for (let i = 0; i < 1; i++) {
    const departement = departements[i];
    SCRAPPER.url = BASE_URL + departement.href;
    await SCRAPPER.navigate();
    let townships = await SCRAPPER.extractFromPage("a.lientxt");
    await pause(500);

    for (let page = 1; page < 10; page++) {
      SCRAPPER.url =
        BASE_URL + `${departement.href.replace(".html", "")}-${page}.html`;

      await SCRAPPER.navigate();
      const _townships = await SCRAPPER.extractFromPage("a.lientxt");
      if (_townships.length === 0 && page > 1) {
        break;
      } else {
        townships = [...townships, ..._townships];
      }
    }

    departementWithTownShips.push({
      ...departement,
      townships,
    });
  }

  const departementWithTownShipsDetails = [];

  for (let i = 0; i < departementWithTownShips.length; i++) {
    const departement = departementWithTownShips[i];
    const townshipsWithDetails = [];
    for (let j = 0; j < departement.townships.length; j++) {
      try {
        const township = departement.townships[j];
        SCRAPPER.url = BASE_URL + township.href;
        await SCRAPPER.navigate();
        const phone = await SCRAPPER.extractFromPage(
          "table:first-child tr:nth-child(2) td:nth-child(2)",
          { text: true }
        );
        const email = await SCRAPPER.extractFromPage(
          "table:first-child tr:nth-child(4) td:nth-child(2)",
          { text: true }
        );
        const population = await SCRAPPER.extractFromPage(
          "table:nth-child(2) tr:nth-child(2) td:nth-child(2)",
          { text: true }
        );
        const website = await SCRAPPER.extractFromPage(
          "table:first-child tr:nth-child(5) td:nth-child(2)",
          { text: true }
        );
        const townhallAdress = await SCRAPPER.extractFromPage(
          "table:first-child tr:nth-child(1) td:nth-child(2)",
          { text: true }
        );
        await pause(500);
        townshipsWithDetails.push({
          ...township,
          phone: phone ? (phone[0] ? phone[0].text : null) : null,
          email: email ? (email[0] ? email[0].text : null) : null,
          population: population
            ? population[0]
              ? population[0].text
              : null
            : null,
          website: website ? (website[0] ? website[0].text : null) : null,
          townhallAdress: townhallAdress
            ? townhallAdress[0]
              ? townhallAdress[0].text
              : null
            : null,
        });
        departementWithTownShipsDetails.push({
          ...departement,
          townships: townshipsWithDetails,
        });
      } catch (error) {
        console.error(departement.townships[j]);
        continue;
      }
    }
  }

  return departementWithTownShipsDetails;
};

run()
  .then((data) => {
    for(let i=0; i<data.length; i++){
      const fileName = `${data[i].text}.json`;
      writeFileSync(join(process.cwd(), 'data', fileName),  JSON.stringify(data[i]))
    }
  })
.then(() => process.exit(0));
