import { useEffect, useState } from "react";

const useDailyPromos = (readContracts, theDate) => {
  const [dailyPromosHash, setDailyPromosHash] = useState({});

  useEffect(() => {
    const getPromos = async () => {
      if (!readContracts || !readContracts.Showcase || !theDate) {
        return;
      }
      const beginningOfPreviousMonth = theDate
        .clone()
        .subtract(1, "months")
        .date(1);
      const theDates = [beginningOfPreviousMonth.unix()];
      [...Array(90)].forEach((val, idx, arr) => {
        theDates.push(
          beginningOfPreviousMonth.add(1, "days").unix(),
        );
      });
      const promos = await readContracts.Showcase.getMultiplePromotions(theDates);
      const promosHash = {};
      theDates.forEach((item, index) => {
        promosHash[item] = promos[index];
      });
      setDailyPromosHash(promosHash);
    };
    getPromos();
  }, [readContracts, readContracts && readContracts.Showcase, theDate]);

  return dailyPromosHash;
};

export default useDailyPromos;
