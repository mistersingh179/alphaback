const hre = require("hardhat");
const { ethers } = hre;
const proxyContracts = require("../../react-app/src/contracts/proxy_contracts.json");
const { getChainId } = require("hardhat");
const { strikethrough } = require("chalk");

const main = async () => {
  const localChainId = await getChainId();
  const FooContractInfo = proxyContracts[localChainId]["Foo"];
  console.log(FooContractInfo);
  const fooContract = new ethers.Contract(
    FooContractInfo.address,
    FooContractInfo.abi,
    ethers.provider
  );
  const code = await ethers.provider.getCode(fooContract.address);
  if (code === "0x") {
    console.log("stopping as contract not found on the chain");
    return;
  }
  const count = await fooContract.count();
  console.log("*** count: ", count.toString());
  const average = await fooContract.average();
  console.log("*** average: ", average.toString());
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
