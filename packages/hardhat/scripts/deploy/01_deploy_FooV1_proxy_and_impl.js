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
  const implName = "FooV1";
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
    console.log("Proxy Contract File not found. will create it.");
  }
  console.log(
    `in: ${fileName} on chain: ${chainId} to deploy proxy: ${proxyContractName} and impl: ${implName}`
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

  const Foo = await getContractFactory(implName);
  const foo = await upgrades.deployProxy(Foo, [100], { kind: "uups" });

  await foo.deployed();

  if (!proxyObj[chainId]) {
    proxyObj[chainId] = {};
  }
  if (!proxyObj[chainId][proxyContractName]) {
    proxyObj[chainId][proxyContractName] = {};
  }
  proxyObj[chainId][proxyContractName].address = foo.address;
  proxyObj[chainId][proxyContractName].abi =
    artifacts.readArtifactSync(implName).abi;

  fs.writeFileSync(proxyContractFilePath, JSON.stringify(proxyObj, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
