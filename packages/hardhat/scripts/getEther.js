const hre = require("hardhat");
const usdcAbi = require("./usdc-abi.json");

const { ethers } = hre;

const init = async () => {
  const [w1] = await ethers.getSigners();
  const whaleAddress = "0x00000000219ab540356cbb839cbe05303d7705fa";
  // this `request` is added by hardhat
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whaleAddress],
  });

  // hre.ethers.provider = new ethers.providers.JsonRpcProvider(
  //   "http://localhost:8545"
  // );
  // const signer = await ethers.provider.getSigner(
  //   "0x378a29135fdFE323414189f682b061fc64aDC0B3"
  // );

  const provider = ethers.getDefaultProvider("http://localhost:8545");
  const signer = await provider.getSigner(whaleAddress);

  let w1Balance = await w1.getBalance();
  console.log("w1 bal: ", ethers.utils.formatEther(w1Balance));
  let signerBalance = await signer.getBalance();
  console.log("signer bal: ", ethers.utils.formatEther(signerBalance));

  await signer.sendTransaction({
    // to: w1.address,
    to: "0x0D2703ac846c26d5B6Bbddf1FD6027204F409785",
    value: ethers.utils.parseEther("1"),
  });

  w1Balance = await w1.getBalance();
  console.log("w1 bal: ", ethers.utils.formatEther(w1Balance));
  signerBalance = await signer.getBalance();
  console.log("signer bal: ", ethers.utils.formatEther(signerBalance));
};

init();
