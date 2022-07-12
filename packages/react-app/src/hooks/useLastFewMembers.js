import { useEffect, useState } from 'react'

const useLastFewMembers = (readContract, txHash) => {
  const [lastFew, setLastFew] = useState([]);
  useEffect(async () => {
    let memberCount = 0;
    const tempList = [];
    if(readContract && readContract.Showcase && readContract.Showcase.membersCount){
      memberCount = await readContract.Showcase.membersCount()
      memberCount = memberCount.toNumber();
    }
    if(readContract && readContract.Showcase && readContract.Showcase.memberAtIndex){
      for(let i=memberCount-1;i>=0;i--){
        const [addr, lastPayoutDate] = await readContract.Showcase.memberAtIndex(i);
        tempList.push(addr);
        if(tempList.length == 10){
          break;
        }
      }
      setLastFew(tempList);
    }
  }, [readContract, readContract && readContract.Showcase, txHash])
  return lastFew;
}

export default useLastFewMembers;