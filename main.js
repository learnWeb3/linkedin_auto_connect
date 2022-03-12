const { writeFileSync, readFileSync, read, readFile, fstat } = require("fs");
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

  // check if scrapper has already been launched on a previous session
  const fileName = "departements_and_townships_links";
  const fileFullName = `${fileName}.json`;
  const temp_data_file_path = join(process.cwd(), "temp", fileFullName);
  let departementWithTownShips = null;
  try {
    departementWithTownShips = readFileSync(temp_data_file_path, {
      encoding: "utf-8",
    });
    departementWithTownShips = JSON.parse(departementWithTownShips);
  } catch (error) {
    console.log(`temp data does not exists yet`);
  }

  if (!departementWithTownShips) {
    await SCRAPPER.navigate();
    const departements = await SCRAPPER.extractFromPage(
      ".table.table-border.table-mobile.mobile-primary.bg-white a.lientxt"
    );
    let departementWithTownShips = [];
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

    try {
      writeFileSync(
        temp_data_file_path,
        JSON.stringify(departementWithTownShips)
      );
      departementWithTownShips = readFileSync(temp_data_file_path, {
        encoding: "utf-8",
      });
    } catch (error) {
      console.error(error);
    }
  }

  const departementWithTownShipsDetails = [];
  let currentDepartment = null;
  try {
    const currentDepartmentPath = join(
      process.cwd(),
      "temp",
      "current_departement.json"
    );
    currentDepartment = JSON.parse(
      readFileSync(currentDepartmentPath, { encoding: "utf-8" })
    );
  } catch (error) {
    console.log(error);
    currentDepartment = null;
  }

  let departementIndex = currentDepartment ? currentDepartment.index : 0;

  for (let i = departementIndex; i < departementWithTownShips.length; i++) {
    const departement = departementWithTownShips[i];

    const path = join(process.cwd(), "temp", "current_departement.json");
    writeFileSync(path, JSON.stringify({ ...departement, index: i }), {
      encoding: "utf-8",
    });

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
      } catch (error) {
        console.error(departement.townships[j]);
      } finally {
        continue;
      }
    }

    const dataToWrite = {
      ...departement,
      townships: townshipsWithDetails,
    };

    try {
      const fileName = dataToWrite.href.replace(".html", "");
      const fileFullName = `${fileName}.json`;
      const filePath = join(process.cwd(), "data", fileFullName);
      console.log(`writing file to ${filePath}`);
      writeFileSync(filePath, JSON.stringify(dataToWrite));
    } catch (error) {
      console.log(error);
    }
  }
};

run().then(() => process.exit(0));
