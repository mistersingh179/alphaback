// deploy/00_deploy_your_contract.js

const hre = require("hardhat");
const moment = require("moment");
const fs = require("fs");
const erc20Abi = require("../../react-app/src/contracts/ABI/IERC20.json");
const { BigNumber } = require("ethers");
const usdcAbi = require("@scaffold-eth/react-app/src/contracts/ABI/IERC20.json");

const { ethers, config } = hre;
const localChainId = "31337";

// const sleep = (ms) =>

//   new Promise((r) =>
//     setTimeout(() => {
//       console.log(`waited for ${(ms / 1000).toFixed(3)} seconds`);
//       r();
//     }, ms)
//   );

function mnemonic() {
  try {
    return fs.readFileSync("./mnemonic.txt").toString().trim();
  } catch (e) {
    if (defaultNetwork !== "localhost") {
      console.log(
        "☢️ WARNING: No mnemonic file created for a deploy account. Try `yarn run generate` and then `yarn run account`."
      );
    }
  }
  return "";
}

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const unnamedAccounts = await getUnnamedAccounts();
  const deployerSigner = ethers.provider.getSigner(0); // any number from 0 to 19 // built-in ethers.js jsonrpcprovider
  const accounts = await ethers.provider.listAccounts();
  const signers = await ethers.getSigners(); // added by hardhat-ethers plugin

  // console.log("*** unnamedAccounts: ", unnamedAccounts);
  console.log("*** accounts: ", accounts);
  console.log(
    "*** deployerSigner:",
    await deployerSigner.getAddress(),
    ethers.utils.formatEther(await deployerSigner.getBalance())
  );
  console.log("*** signers: ", signers.length, await signers[0].getAddress());
  console.log("*** ethers.utils.defaultPath: ", ethers.utils.defaultPath);
  const mnemonic = config.networks.hardhat.accounts.mnemonic;
  console.log("*** mnemonic: ", mnemonic);

  const masterNode = ethers.utils.HDNode.fromMnemonic(mnemonic);

  const hdw0 = masterNode.derivePath("m/44'/60'/0'/0/0");
  console.log("hdw0: ", hdw0.address, hdw0.privateKey, hdw0.index);
  const w0 = new ethers.Wallet(hdw0.privateKey, ethers.provider);
  console.log(
    await w0.getAddress(),
    ethers.utils.formatEther(await w0.getBalance())
  );

  const hdw1 = masterNode.derivePath("m/44'/60'/0'/0/1");
  console.log("hdw1: ", hdw1.address, hdw1.privateKey, hdw1.index);
  const w1 = new ethers.Wallet(hdw1.privateKey, ethers.provider);
  console.log(
    await w1.getAddress(),
    ethers.utils.formatEther(await w1.getBalance())
  );

  let usdcAddress = ethers.constants.AddressZero;
  if (chainId === localChainId) {
    usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // from mainnet
  } else if (chainId === "80001") {
    usdcAddress = "0x0fa8781a83e46826621b3bc094ea2a0212e71b23";
  } else if (chainId === "137") {
    usdcAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
  }

  console.log(
    "chaindId: ",
    chainId,
    " and usdcAddress: ",
    usdcAddress,
    " deployer: ",
    deployer
  );

  await deploy("Showcase", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [usdcAddress],
    log: true,
    waitConfirmations: 5,
  });

  // Getting a previously deployed contract
  const Showcase = await ethers.getContract("Showcase", deployer);
  if (chainId === 137) {
    const s = "0x378a29135fdFE323414189f682b061fc64aDC0B3";
    const r = "0xdDb1a644f0d61a3E03E9076221BaedA4b70200CE";
    const result = await Showcase.addMembers(
      [s, r],
      [
        moment.utc().subtract(1, "days").startOf("day").unix(),
        moment.utc().subtract(1, "days").startOf("day").unix(),
      ]
    );
    console.log(result);
  } else if (chainId === localChainId) {
    try {
      const chromeBrowserAddress = "0xF530CAb59d29c45d911E3AfB3B69e9EdB68bA283";
      const safariBrowserAddress = "0x8d4941EC90849bF71d4A39C953e3153C953afFb9";
      const result = await Showcase.addMembers(
        [chromeBrowserAddress, safariBrowserAddress],
        [moment.utc().startOf("day").unix(), moment.utc().startOf("day").unix()]
        // adding with todays date. this way they dont get paid for today
        // and any promotion which comes in today before me wont have me in their members count & wont pay me
        // any promotion which comes tomorrow will have my in their count & will pay me
        // any promotion which comes today after adding me, will include me in their count but wont pay me
        // this last scenerio leads to dust
        // if we put past date then it can withdraw for today, but others have withdraw today before me with different count
        // if we put future date then new promos coming in the mean time will include me in the count
      );
      console.log(result);
      await deployerSigner.sendTransaction({
        to: chromeBrowserAddress,
        value: ethers.utils.parseEther(".01"),
      });
      const whaleAddress = "0x72a53cdbbcc1b9efa39c834a540550e23463aacb";
      await deployerSigner.sendTransaction({
        to: whaleAddress,
        value: ethers.utils.parseEther(".01"),
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

  /*
    To take ownership of yourContract using the ownable library uncomment next line and add the 
    address you want to be the owner. 
    // await yourContract.transferOwnership(YOUR_ADDRESS_HERE);

    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */

  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */

  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */

  // Verify from the command line by running `yarn verify`

  // You can also Verify your contracts with Etherscan here...
  // You don't want to verify on localhost
  try {
    if (chainId !== localChainId) {
      await run("verify:verify", {
        address: Showcase.address,
        contract: "contracts/Showcase.sol:Showcase",
        constructorArguments: [usdcAddress],
      });
    }
  } catch (error) {
    console.error(error);
  }
};
module.exports.tags = ["Showcase"];
