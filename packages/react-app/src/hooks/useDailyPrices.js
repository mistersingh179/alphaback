import { useEffect, useState } from "react";

const useDailyPrices = (readContracts, theDate) => {
  const [dailyPricesHash, setDailyPricesHash] = useState({});

  useEffect(() => {
    const getPrices = async () => {
      if (!readContracts || !readContracts.Showcase || !theDate) {
        return;
      }
      const beginningOfPreviousMonth = theDate
        .clone()
        .subtract(1, "months")
        .date(1);
      const theDates = [beginningOfPreviousMonth.format("YYYY-MM-DD")];
      [...Array(90)].forEach((val, idx, arr) => {
        theDates.push(
          beginningOfPreviousMonth.add(1, "days").format("YYYY-MM-DD"),
        );
      });
      const costs = await readContracts.Showcase.getMultipleDayCosts(theDates);
      const defaultCost = await readContracts.Showcase.defaultCost();
      const costsHash = {};
      theDates.forEach((item, index) => {
        if (costs[index] == 0) {
          costsHash[item] = defaultCost;
        } else {
          costsHash[item] = costs[index];
        }
      });
      setDailyPricesHash(costsHash);
    };
    getPrices();
  }, [readContracts, readContracts && readContracts.Showcase, theDate]);

  return dailyPricesHash;
};

export default useDailyPrices;
