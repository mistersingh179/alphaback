/* eslint-disable no-await-in-loop */

const path = require("path");
const hre = require("hardhat");
const fs = require("fs");
const erc20Abi = require("@scaffold-eth/react-app/src/contracts/ABI/IERC20.json");
const moment = require("moment");

const { ethers, upgrades, artifacts, config, network, getChainId } = hre;

const {
  getContract,
  getContractFactory,
  getSigner,
  constants: { AddressZero, EtherSymbol },
  utils: { formatEther },
} = ethers;

const { erc1967 } = upgrades;

async function main() {
  // const accounts = await ethers.getSigners();
  const chainId = await getChainId();
  const localChainId = "31337";
  const implName = "LeaderBoardV1"; /* !! CHANGE ME !! */
  const proxyContractName = "LeaderBoard"; /* !! CHANGE ME !! */
  const contractFileLocations = [
    "/Users/sandeeparneja/code_mistersingh179/alphaback_v2/src/contracts/proxy_contracts.json",
    "/Users/sandeeparneja/code_mistersingh179/alphaback/packages/react-app/src/contracts/proxy_contracts.json",
  ]; /* !! CHANGE ME !! */

  let proxyObj = {};
  try {
    const proxyFile = fs.readFileSync(contractFileLocations[0]);
    proxyObj = JSON.parse(proxyFile);
  } catch (e) {
    console.log("Proxy Contract File not found. will create it.");
  }
  console.log(
    `in: ${contractFileLocations[0]} on chain: ${chainId} to deploy proxy: ${proxyContractName} and impl: ${implName}`
  );

  if (
    chainId !== localChainId &&
    proxyObj &&
    proxyObj[chainId] &&
    proxyObj[chainId][proxyContractName] &&
    proxyObj[chainId][proxyContractName].address
  ) {
    console.log("not in dev & contract already deployed. skipping redeploy");
    return;
  }

  /* !! CHANGE ME !! */
  const deployerSigner = ethers.provider.getSigner(0);
  console.log("deployed with address: ", await deployerSigner.getAddress());

  let usdcAddress = ethers.constants.AddressZero;
  if (chainId === localChainId) {
    usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // from mainnet
  } else if (chainId === "80001") {
    usdcAddress = "0x0fa8781a83e46826621b3bc094ea2a0212e71b23"; // on mumbai
  } else if (chainId === "137") {
    usdcAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"; // on polygon
  }

  const Contract = await getContractFactory(implName);
  const contract = await upgrades.deployProxy(
    Contract,
    [] /* !! CHANGE ME !! */,
    {
      kind: "uups",
    }
  );

  await contract.deployed();

  if (!proxyObj[chainId]) {
    proxyObj[chainId] = {};
  }
  if (!proxyObj[chainId][proxyContractName]) {
    proxyObj[chainId][proxyContractName] = {};
  }
  proxyObj[chainId][proxyContractName].address = contract.address;
  proxyObj[chainId][proxyContractName].abi =
    artifacts.readArtifactSync(implName).abi;

  contractFileLocations.forEach((filePath) => {
    fs.writeFileSync(filePath, JSON.stringify(proxyObj, null, 2));
  });
  if (chainId === localChainId) {
    const s = "0x378a29135fdFE323414189f682b061fc64aDC0B3";
    console.log("making s owner");
    await contract.transferOwnership(s);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
