import { useEffect, useState } from 'react'
import {ethers} from 'ethers';

const useUsdcBalance = (readContracts, address, txHash) => {
  const [bal, setBal] = useState(ethers.BigNumber.from(0));
  useEffect(async () => {
    if(address && readContracts && readContracts.USDC){
      const ans = await readContracts.USDC.balanceOf(address);
      setBal(ans);
    }
  }, [address, readContracts, readContracts && readContracts.USDC, txHash]);
  return bal;
}

export default useUsdcBalance;