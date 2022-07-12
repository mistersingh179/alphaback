import { useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "antd";
import usdcAbi from "../contracts/ABI/IERC20.json";
import { useMemberBalance, useUsdcBalance } from '../hooks'
import getSeqDates from '../helpers/getSeqDates'

/**
 * web3 props can be passed from '../App.jsx' into your local view component for use
 * @param {*} yourLocalBalance balance on current network
 * @param {*} readContracts contracts from current chain already pre-loaded using ethers contract module. More here https://docs.ethers.io/v5/api/contract/contract/
 * @returns react componenti
 **/
function Home({
  yourLocalBalance,
  readContracts,
  writeContracts,
  localProvider,
  address,
  tx,
  userSigner,
}) {
  // you can also use hooks locally in your component of choice
  // in this case, let's keep track of 'purpose' variable from our contract
  const purpose = useContractReader(readContracts, "YourContract", "purpose");
  const [ethBalance, setEthBalance] = useState(ethers.BigNumber.from(0));
  useEffect(() => {
    const getBalance = async () => {
      if (userSigner) {
        let ourBalance = await userSigner.getBalance();
        console.log("ourBalance: ", ethers.utils.formatUnits(ourBalance, 18));
        setEthBalance(ourBalance);
      }
    };
    getBalance();
  }, [userSigner, address]);
  const getEth = async () => {
    console.log("*** in getEth");
    const whaleAddress = "0x00000000219ab540356cbb839cbe05303d7705fa";
    await localProvider.send("hardhat_impersonateAccount", [whaleAddress]);
    const signer = await localProvider.getSigner(whaleAddress);
    let signerBalance = await signer.getBalance();
    console.log("*** signer: ", ethers.utils.formatUnits(signerBalance, 18));
    console.log("*** to address: ", address);
    await signer.sendTransaction({
      to: address,
      value: ethers.utils.parseUnits("1", 18),
    });
    let ourBalance = await userSigner.getBalance();
    console.log("ourBalance: ", ethers.utils.formatUnits(ourBalance, 18));
    setEthBalance(ourBalance);
  };
  const [usdcBalance, setUsdcBalance] = useState(ethers.BigNumber.from(0));
  useEffect(() => {
    const getBalance = async () => {
      if (address && address != ethers.constants.AddressZero) {
        const usdcContractAddress =
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        const usdcContract = new ethers.Contract(
          usdcContractAddress,
          usdcAbi,
          localProvider,
        );
        let ourBalance = await usdcContract.balanceOf(address);
        console.log("ourBalance: ", ethers.utils.formatUnits(ourBalance, 18));
        setUsdcBalance(ourBalance);
      }
    };
    getBalance();
  }, [address]);
  const getUsdc = async () => {
    const usdcContractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const usdcWhaleAddress = "0x0D2703ac846c26d5B6Bbddf1FD6027204F409785";
    await userSigner.sendTransaction({
      to: usdcWhaleAddress,
      value: ethers.utils.parseUnits(".01", 18),
    });
    await localProvider.send("hardhat_impersonateAccount", [usdcWhaleAddress]);
    const signer = await localProvider.getSigner(usdcWhaleAddress);
    const usdcContract = new ethers.Contract(
      usdcContractAddress,
      usdcAbi,
      localProvider,
    ).connect(signer);
    await usdcContract.transfer(address, ethers.utils.parseUnits("1000", 6));
    let ourBalance = await usdcContract.balanceOf(address);
    console.log("ourBalance: ", ethers.utils.formatUnits(ourBalance, 18));
    setUsdcBalance(ourBalance);
  };
  const [txId, setTxId] = useState(null);
  const [showcaseUSDCBalanace, setShowcaseUSDCBalanace] = useState(
    ethers.BigNumber.from(0),
  );
  useEffect(() => {
    const getShowcaseUsdcBal = async () => {
      if(readContracts && readContracts.USDC && readContracts.Showcase){
        const result = await readContracts.USDC.balanceOf(readContracts.Showcase.address);
        setShowcaseUSDCBalanace(result)
      }
    }
    getShowcaseUsdcBal();
  }, [
    readContracts,
    readContracts && readContracts.USDC,
    readContracts && readContracts.Showcase,
    txId,
  ]);
  const [deployerUsdcBalance, setdeployerUsdcBalance] = useState(ethers.BigNumber.from(0));
  useEffect(() => {
    const getBalance = async () => {
      if (address && address != ethers.constants.AddressZero) {
        const usdcContractAddress =
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        const usdcContract = new ethers.Contract(
          usdcContractAddress,
          usdcAbi,
          localProvider,
        );
        let ourBalance = await usdcContract.balanceOf("0x6B09B3C63B72fF54Bcb7322B607E304a13Fba72B");
        console.log("ourBalance: ", ethers.utils.formatUnits(ourBalance, 18));
        setdeployerUsdcBalance(ourBalance);
      }
    };
    getBalance();
  }, [address]);
  const memberBalance = useMemberBalance(readContracts, address);
  const withdrawMemberBalance = async () => {
    const seqDates = await getSeqDates(readContracts, address);
    const result = await tx(writeContracts.Showcase.memberWithdrawBalance(seqDates));
    console.log("result: ", result);
    if(result){
      const receipt = await result.wait();
      console.log("receipt: ", receipt);
    }
  }

  return (
    <div>
      <div style={{ margin: 32 }}>
        <div style={{ margin: 32 }}>
          <Button type="primary" onClick={() => getEth()}>
            Get Eth
          </Button>
          <span>
            {" "}
            Eth Balance: {ethers.constants.EtherSymbol}{" "}
            {ethers.utils.formatUnits(ethBalance.toString(), 18)}
          </span>
        </div>
        <div style={{ margin: 32 }}>
          <Button type="primary" onClick={() => getUsdc()}>
            Get USDC
          </Button>
          <span>
            {" "}
            USDC Balance: ${" "}
            {ethers.utils.formatUnits(usdcBalance.toString(), 6)}
          </span>
        </div>
        <div style={{ margin: 32 }}>
          <span>
            Showcase USDC Balance: ${" "}
            {ethers.utils.formatUnits(showcaseUSDCBalanace.toString(), 6)}
          </span>
        </div>
        <div style={{ margin: 32 }}>
          <span>
            Deployer USDC Balance: ${" "}
            {ethers.utils.formatUnits(deployerUsdcBalance.toString(), 6)}
          </span>
        </div>
        <div style={{ margin: 32 }}>
          <span>
            My Member Balance: ${" "}
            {ethers.utils.formatUnits(memberBalance.toString(), 6)}{" "}
            <Button type={'primary'} onClick={withdrawMemberBalance}>Withdraw</Button>
          </span>
        </div>
        <span style={{ marginRight: 8 }}>📝</span>
        This Is Your App Home. You can start editing it in{" "}
        <span
          className="highlight"
          style={{
            marginLeft: 4,
            /* backgroundColor: "#f9f9f9", */ padding: 4,
            borderRadius: 4,
            fontWeight: "bolder",
          }}
        >
          packages/react-app/src/views/Home.jsx
        </span>
      </div>
      <div style={{ margin: 32 }}>
        <span style={{ marginRight: 8 }}>✏️</span>
        Edit your smart contract{" "}
        <span
          className="highlight"
          style={{
            marginLeft: 4,
            /* backgroundColor: "#f9f9f9", */ padding: 4,
            borderRadius: 4,
            fontWeight: "bolder",
          }}
        >
          YourContract.sol
        </span>{" "}
        in{" "}
        <span
          className="highlight"
          style={{
            marginLeft: 4,
            /* backgroundColor: "#f9f9f9", */ padding: 4,
            borderRadius: 4,
            fontWeight: "bolder",
          }}
        >
          packages/hardhat/contracts
        </span>
      </div>
      {!purpose ? (
        <div style={{ margin: 32 }}>
          <span style={{ marginRight: 8 }}>👷‍♀️</span>
          You haven't deployed your contract yet, run
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            yarn chain
          </span>{" "}
          and{" "}
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            yarn deploy
          </span>{" "}
          to deploy your first contract!
        </div>
      ) : (
        <div style={{ margin: 32 }}>
          <span style={{ marginRight: 8 }}>🤓</span>
          The "purpose" variable from your contract is{" "}
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            {purpose}
          </span>
        </div>
      )}

      <div style={{ margin: 32 }}>
        <span style={{ marginRight: 8 }}>🤖</span>
        An example prop of your balance{" "}
        <span style={{ fontWeight: "bold", color: "green" }}>
          ({ethers.utils.formatEther(yourLocalBalance)})
        </span>{" "}
        was passed into the
        <span
          className="highlight"
          style={{
            marginLeft: 4,
            /* backgroundColor: "#f9f9f9", */ padding: 4,
            borderRadius: 4,
            fontWeight: "bolder",
          }}
        >
          Home.jsx
        </span>{" "}
        component from
        <span
          className="highlight"
          style={{
            marginLeft: 4,
            /* backgroundColor: "#f9f9f9", */ padding: 4,
            borderRadius: 4,
            fontWeight: "bolder",
          }}
        >
          App.jsx
        </span>
      </div>
      <div style={{ margin: 32 }}>
        <span style={{ marginRight: 8 }}>💭</span>
        Check out the <Link to="/hints">"Hints"</Link> tab for more tips.
      </div>
      <div style={{ margin: 32 }}>
        <span style={{ marginRight: 8 }}>🛠</span>
        Tinker with your smart contract using the{" "}
        <Link to="/debug">"Debug Contract"</Link> tab.
      </div>
    </div>
  );
}

export default Home;
