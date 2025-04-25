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
  const accounts = await ethers.getSigners();
  const chainId = await getChainId();
  const localChainId = "31337";
  const implName = "PromotionsV1"; /* !! CHANGE ME !! */
  const proxyContractName = "Promotions"; /* !! CHANGE ME !! */
  const contractFileLocations = [
    "/Users/sandeeparneja/code_mistersingh179/alphaback/packages/react-app/src/contracts/proxy_contracts.json",
    "/Users/sandeeparneja/code_mistersingh179/alphaback_v2/src/contracts/proxy_contracts.json",
  ];
  /* !! CHANGE ME !! */

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
    [usdcAddress] /* !! CHANGE ME !! */,
    {
      kind: "uups",
    }
  );

  await contract.deployed();

  /* !! CHANGE ME !! */
  const deployerSigner = ethers.provider.getSigner(0);
  const startOfToday = moment.utc().startOf("day").unix();
  const membersCount = await contract.membersCount();
  console.log("membersCount: ", membersCount.toNumber(), membersCount.eq(0));
  if (membersCount.eq(0) && chainId === "137") {
    const s = "0x378a29135fdFE323414189f682b061fc64aDC0B3";
    const r = "0xdDb1a644f0d61a3E03E9076221BaedA4b70200CE";
    const result = await contract.addMembers(
      [s, r],
      [startOfToday, startOfToday]
    );
    console.log(result);
  } else if (chainId === localChainId) {
    try {
      const chromeBrowserAddress = "0xF530CAb59d29c45d911E3AfB3B69e9EdB68bA283";
      const safariBrowserAddress = "0x8d4941EC90849bF71d4A39C953e3153C953afFb9";
      const s = "0x378a29135fdFE323414189f682b061fc64aDC0B3";
      const r = "0xdDb1a644f0d61a3E03E9076221BaedA4b70200CE";
      const admin = "0x6B09B3C63B72fF54Bcb7322B607E304a13Fba72B";
      const result = await contract.addMembers(
        [chromeBrowserAddress, safariBrowserAddress, s, r, admin],
        Array(5).fill(startOfToday)
      );
      console.log(result);
      await deployerSigner.sendTransaction({
        to: chromeBrowserAddress,
        value: ethers.utils.parseEther("1.01"),
      });
      const whaleAddress = "0x72a53cdbbcc1b9efa39c834a540550e23463aacb";
      await deployerSigner.sendTransaction({
        to: whaleAddress,
        value: ethers.utils.parseEther("1.01"),
      });
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [whaleAddress],
      });
      const provider = ethers.getDefaultProvider("http://localhost:8545");
      const signer = await provider.getSigner(whaleAddress);
      const usdcContract = new ethers.Contract(usdcAddress, erc20Abi, provider);
      await usdcContract
        .connect(signer)
        .transfer(chromeBrowserAddress, ethers.utils.parseUnits("1000", 6));
    } catch (e) {
      console.log("");
    }
  }

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
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
