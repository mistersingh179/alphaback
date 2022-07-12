import { Tooltip } from 'antd'
import getSeqDates from '../helpers/getSeqDates'
import { useMemberBalance } from '../hooks'
import { useState } from 'react'
import { ethers } from 'ethers';

const MemberBalance = props => {
  const {readContracts, writeContracts, tx, address, fontSize} = props;
  const [lastTx, setLastTx] = useState(null);
  const bal = useMemberBalance(readContracts, address, lastTx);
  const displayBalance = "$" + ethers.utils.formatUnits(bal, 6);
  const withdrawMemberBalance = async () => {
    const seqDates = await getSeqDates(readContracts, address);
    const result = await tx(writeContracts.Showcase.memberWithdrawBalance(seqDates));
    console.log("result: ", result);
    if(result){
      const receipt = await result.wait();
      console.log("receipt: ", receipt);
      if(receipt && receipt.transactionHash){
        setLastTx(receipt.transactionHash)
      }
    }
  }
  return (
    <span
      style={{
        verticalAlign: "middle",
        fontSize: fontSize ? fontSize : 24,
        padding: 8,
        cursor: "pointer",
      }}
      onClick={withdrawMemberBalance}
    >
      <Tooltip title="Click to withdraw your balance">
        {displayBalance}
      </Tooltip>

    </span>
  );
}

export default MemberBalance;