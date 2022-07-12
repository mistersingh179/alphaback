import { useEffect, useState } from "react";
import { getSeqDates } from "../helpers";
const ethers = require("ethers");
const { BigNumber } = ethers;

const useMemberBalance = (readContracts, address, lastTx) => {
  const [bal, setBal] = useState(BigNumber.from(0));
  const getBal = async () => {
    try{
      if (address && readContracts && readContracts.Showcase) {
        const seqDates = await getSeqDates(readContracts, address);
        console.log("*** seqDates ", seqDates);
        const [bal, newLastPayoutDate] = await readContracts.Showcase.memberBalance(address, seqDates);
        console.log("*** bal from contract: ", bal.toString());
        setBal(bal);
      }
    }catch(e){
      console.log("error getting your balance");
    }
  };
  useEffect(() => {
    getBal();
  }, [address, readContracts, readContracts && readContracts.Showcase, lastTx]);

  return bal;
};

export default useMemberBalance;
