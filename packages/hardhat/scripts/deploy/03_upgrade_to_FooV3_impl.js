/* eslint-disable no-await-in-loop */

const path = require("path");
const hre = require("hardhat");
const fs = require("fs");

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
  const implName = "FooV3";
  const proxyContractName = "Foo";
  const fileName = path.basename(__filename);
  const frontendProjectPath = path.join(
    __dirname,
    "../../../react-app/src/contracts"
  );
  const proxyContractFilePath = path.join(
    frontendProjectPath,
    "proxy_contracts.json"
  );
  let proxyObj = {};
  try {
    const proxyFile = fs.readFileSync(proxyContractFilePath);
    proxyObj = JSON.parse(proxyFile);
  } catch (e) {
    console.log("Proxy Contract File not found. can NOT proceed with update!");
    return;
  }
  const proxyAddress = proxyObj[chainId][proxyContractName].address;

  console.log(
    `in: ${fileName} on chain: ${chainId} to deploy proxy: ${proxyContractName} at` +
      `address: ${proxyAddress} with new impl: ${implName}`
  );

  const Foo = await getContractFactory(implName);
  const foo = await upgrades.upgradeProxy(proxyAddress, Foo, {
    call: {
      fn: "initialize",
      args: [],
    },
  });

  await foo.deployed();

  proxyObj[chainId][proxyContractName].abi =
    artifacts.readArtifactSync(implName).abi;

  fs.writeFileSync(proxyContractFilePath, JSON.stringify(proxyObj, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
