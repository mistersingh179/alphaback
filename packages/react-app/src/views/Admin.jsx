import { useContractReader } from "eth-hooks";
import { Button, Col, DatePicker, InputNumber, List, Row } from "antd";
import { useEffect, useState } from "react";
import TextArea from "antd/es/input/TextArea";
import moment from "moment";
import { BigNumber, utils } from "ethers";
import { ethers } from "ethers";
import { useUsdcBalance } from "../hooks";
import usdcAbi from "../contracts/ABI/IERC20.json";
import { Transactor } from "../helpers";
import useLastFewMembers from "../hooks/useLastFewMembers";

const Admin = props => {
  const {
    readContracts,
    writeContracts,
    tx,
    address,
    userSigner,
    localProvider,
    yourLocalBalance,
  } = props;

  const memberCount = useContractReader(
    readContracts,
    "Showcase",
    "membersCount",
  );
  const [txHash, setTxHash] = useState(0);

  const [addressList, setAddressList] = useState("");
  const addMembers = async () => {
    const addresses = addressList.split("\n");
    const dates = addresses.map(() =>
      BigNumber.from(moment().utc().startOf("day").subtract(1, "days").unix()),
    );
    console.log("going to add: ", addresses, dates);
    try {
      await tx(writeContracts.Showcase.addMembers(addresses, dates), result => {
        setAddressList("");
        setTxHash(result.transactionHash);
      });
    } catch (e) {
      console.error("unable to add members", e);
    }
  };
  const removeMembers = async () => {
    const addresses = addressList.split("\n");
    try {
      await tx(writeContracts.Showcase.removeMembers(addresses), result => {
        setAddressList("");
        setTxHash(result.transactionHash);
      });
    } catch (e) {
      console.error("unable to add members", e);
    }
  };

  const memberUsdcBalance = useUsdcBalance(readContracts, address, txHash);
  const getMoreUsdc = async () => {
    const usdcContractAddress = readContracts.USDC.address;
    const usdcWhaleAddress = "0x0D2703ac846c26d5B6Bbddf1FD6027204F409785";
    await userSigner.sendTransaction({
      to: usdcWhaleAddress,
      value: ethers.utils.parseUnits(".01", 18),
    });
    await localProvider.send("hardhat_impersonateAccount", [usdcWhaleAddress]);
    const signer = await localProvider.getSigner(usdcWhaleAddress);
    await tx(
      writeContracts.USDC.connect(signer).transfer(
        address,
        ethers.utils.parseUnits("1000", 6),
      ),
      result => setTxHash(result.transactionHash),
    );
  };
  const getMoreEth = async () => {
    const tx2 = Transactor(localProvider);
    tx2({
      to: address,
      value: ethers.utils.parseEther("1.0"),
    });
  };
  let showcaseAddress = ethers.constants.AddressZero;
  if (
    readContracts &&
    readContracts.Showcase &&
    readContracts.Showcase.address
  ) {
    showcaseAddress = readContracts.Showcase.address;
  }
  const contractUsdcBalance = useUsdcBalance(
    readContracts,
    showcaseAddress,
    txHash,
  );
  const adminUsdcBalance = useUsdcBalance(
    readContracts,
    process.env.REACT_APP_DEPLOYER_ADDRESS,
    txHash,
  );
  const lastFew = useLastFewMembers(readContracts, txHash);

  const [defaultCost, setDefaultCost] = useState(BigNumber.from(0));
  useEffect(async () => {
    if (
      readContracts &&
      readContracts.Showcase &&
      readContracts.Showcase.defaultCost
    ) {
      const ans = await readContracts.Showcase.defaultCost();
      setDefaultCost(ans);
    }
  }, [readContracts, readContracts && readContracts.Showcase, txHash]);
  const [inputtedDefaultCost, setInputtedDefaultCost] = useState();
  const updateDefaultCost = async () => {
    await tx(
      writeContracts.Showcase.setDefaultCost(
        BigNumber.from(inputtedDefaultCost),
      ),
      result => {
        setTxHash(result.transactionHash);
      },
    );
  };

  const [inputtedDate, setInputtedDate] = useState(moment());
  const [inputtedDayCost, setInputtedDayCost] = useState();
  const updateDayCost = async () => {
    await tx(
      writeContracts.Showcase.setDayCost(
        inputtedDate.utc().startOf("day").unix(),
        BigNumber.from(inputtedDayCost),
      ),
      result => {
        setTxHash(result.transactionHash);
      },
    );
  };
  const formattedInputtedDayCost = () => {
    try{
      return ethers.utils.formatUnits(inputtedDayCost, 6);
    }catch(e){
      return ""
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div>
        <Row gutter={[16, 16]}>
          <Col span={8} offset={8}>
            Current Member Count: {memberCount && memberCount.toString()}
          </Col>
          <Col span={8}></Col>

          <Col span={8} offset={8}>
            <TextArea
              size="large"
              placeholder="Enter addresses here. Enter 1 address per line."
              autoSize={{ minRows: 2 }}
              value={addressList}
              onChange={e => {
                setAddressList(e.target.value);
              }}
            />
          </Col>
          <Col span={8}></Col>

          <Col span={8} offset={8}>
            <Button onClick={addMembers}>Add more Members</Button>{" "}
            <Button onClick={removeMembers}>Remove existing Members</Button>
          </Col>
          <Col span={8}></Col>

          <Col span={8} offset={8}>
            My aka Member's USDC Balance: ${" "}
            {ethers.utils.formatUnits(memberUsdcBalance.toString(), 6)}{" "}
            <Button onClick={getMoreUsdc}>Get More USDC</Button>
          </Col>
          <Col span={8}></Col>

          <Col span={8} offset={8}>
            My aka Member's Eth Balance: {ethers.constants.EtherSymbol}{" "}
            {ethers.utils.formatEther(yourLocalBalance)}{" "}
            <Button onClick={getMoreEth}>Get More Eth</Button>
          </Col>
          <Col span={8}></Col>

          <Col span={8} offset={8}>
            Contract USDC Balance: ${" "}
            {ethers.utils.formatUnits(contractUsdcBalance.toString(), 6)}{" "}
          </Col>
          <Col span={8}></Col>

          <Col span={8} offset={8}>
            Admin aka Deployer USDC Balance: ${" "}
            {ethers.utils.formatUnits(adminUsdcBalance.toString(), 6)}{" "}
          </Col>
          <Col span={8}></Col>

          <Col span={8} offset={8}>
            <List
              header={<div>Last 10 Members</div>}
              bordered
              dataSource={lastFew}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
          <Col span={8}></Col>

          <Col span={8} offset={8}>
            Default Day Cost: {ethers.utils.formatUnits(defaultCost, 6)}
            <br />
            Set New Default Cost{" "}
            <InputNumber
              value={inputtedDefaultCost}
              onChange={val => setInputtedDefaultCost(val)}
              style={{ width: 250 }}
            />{" "}
            No decimals please{" "}
            <Button onClick={updateDefaultCost}>Update Daily Cost </Button>
          </Col>
          <Col span={8}></Col>

          <Col span={8} offset={8}>
            Set Day Cost for {inputtedDate.utc().startOf("day").format()} to{" "}
            {formattedInputtedDayCost()}
            <br />
            <DatePicker onChange={val => setInputtedDate(val)} />
            <InputNumber
              value={inputtedDayCost}
              onChange={val => setInputtedDayCost(val)}
              style={{ width: 250 }}
            />{" "}
            No decimals please
            <Button onClick={updateDayCost}>Update Daily Cost </Button>
          </Col>
          <Col span={8}></Col>
        </Row>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
      </div>
    </div>
  );
};

export default Admin;