import { useContractReader } from "eth-hooks";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  InputNumber,
  List,
  Row,
  Timeline,
} from "antd";
import { useEffect, useState } from "react";
import TextArea from "antd/es/input/TextArea";
import moment from "moment";
import { BigNumber, utils } from "ethers";
import { ethers } from "ethers";
import { useUsdcBalance, useProxyContract } from "../hooks";
import usdcAbi from "../contracts/ABI/IERC20.json";
import { Transactor } from "../helpers";
import useLastFewMembers from "../hooks/useLastFewMembers";
import { formatUnits } from "ethers/lib/utils";
import { Address } from "../components";

const Admin = props => {
  const {
    readContracts,
    writeContracts,
    tx,
    address,
    userSigner,
    localProvider,
    yourLocalBalance,
    localChainId,
  } = props;

  const blockTimestamp = useContractReader(
    readContracts,
    "Showcase",
    "timestamp",
  );

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
      BigNumber.from(moment().utc().startOf("day").unix()),
    );
    console.log("**** going to add: ", addresses, dates);
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
    const usdcWhaleAddress = "0x72a53cdbbcc1b9efa39c834a540550e23463aacb";
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
    try {
      return ethers.utils.formatUnits(inputtedDayCost, 6);
    } catch (e) {
      return "";
    }
  };
  const [moveForwardDate, setMoveForwardDate] = useState(moment());

  const doEmptyTransaction = async () => {
    await tx(writeContracts.Showcase.doEmptyTransaction());
  };

  const moveTimeForward = async () => {
    console.log("*** in moveTimeForward");
    await localProvider.send("evm_setNextBlockTimestamp", [
      moveForwardDate.utc().unix(),
    ]);
    await localProvider.send("evm_mine");
  };

  const [showHistory, setShowHistory] = useState(false);

  const ToggleHistoryButton = props => {
    return (
      <Button
        onClick={() => {
          setShowHistory(val => !val);
        }}
      >
        Toggle History
      </Button>
    );
  };

  const fooContract = useProxyContract(
    "Foo",
    localChainId,
    localProvider,
    userSigner,
  );
  const [count, setCount] = useState(0);
  useEffect(async () => {
    if (fooContract) {
      console.log("***reading count from fooContract");
      const c = await fooContract.count();
      console.log("***and got: ", c);
      setCount(c);
    }
  }, [fooContract, txHash]);
  const incrementCount = async () => {
    await tx(fooContract.incrementCount(), result =>
      setTxHash(result.transactionHash),
    );
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div>
        <Row gutter={[16, 16]}>
          <Col span={8} offset={8}>
            Block Timestamp:{" "}
            {blockTimestamp &&
              moment.unix(blockTimestamp.toString()).utc().format()}
            <br />
            Machine Timestamp: {moment().utc().format()}
            {Math.abs(blockTimestamp - moment().utc().unix()) > 60 * 60 && (
              <Alert message="More than 1 hour Mismatch!" type="error" />
            )}
            {Math.abs(blockTimestamp - moment().utc().unix()) <= 60 * 60 && (
              <Alert
                message="Times are within 1 hour of each-other."
                type="success"
              />
            )}
            <br />
            {/*<DatePicker*/}
            {/*  showTime={true}*/}
            {/*  onChange={val => {*/}
            {/*    if (val) {*/}
            {/*      setMoveForwardDate(val);*/}
            {/*    }*/}
            {/*  }}*/}
            {/*/>{" "}*/}
            {/*<Button onClick={moveTimeForward}>Move Time Forward</Button> <br/><br/>*/}
            <Button onClick={doEmptyTransaction}>Sync w/ Sys Time</Button>
          </Col>
          <Col span={8}></Col>

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
              header={
                <div>
                  Last 10 Members <ToggleHistoryButton />
                </div>
              }
              bordered
              dataSource={lastFew}
              renderItem={item => (
                <List.Item>
                  <Address address={item[0]} fontSize={14} />{" "}
                  {moment.unix(item[1]).utc().format()} - ${" "}
                  {formatUnits(item[2], 6)} <br />
                  <br />
                  {showHistory && (
                    <Timeline mode={"left"}>
                      {item[3][0].map(function (obj, i) {
                        return (
                          <Timeline.Item
                            color={
                              parseInt(item[3][1][i]) > 0 ? "green" : "gray"
                            }
                            label={moment.unix(obj).utc().format("YYYY-MM-DD")}
                          >
                            {parseInt(item[3][1][i]) >= 0 &&
                              formatUnits(parseInt(item[3][1][i]), 6)}
                            {Number.isNaN(parseInt(item[3][1][i])) &&
                              item[3][1][i]}
                          </Timeline.Item>
                        );
                      })}
                    </Timeline>
                  )}
                </List.Item>
              )}
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
            <DatePicker
              onChange={val => {
                if (val) {
                  setInputtedDate(val);
                }
              }}
            />
            <InputNumber
              value={inputtedDayCost}
              onChange={val => setInputtedDayCost(val)}
              style={{ width: 250 }}
            />{" "}
            No decimals please
            <Button onClick={updateDayCost}>Update Daily Cost </Button>
          </Col>
          <Col span={8}></Col>

          <Col span={8} offset={8}>
            Foo Count: {count && count.toString()}
            <Button onClick={incrementCount}>Increment Count</Button>
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
