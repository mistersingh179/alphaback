const hre = require("hardhat");
const usdcAbi = require("./usdc-abi.json");
const { ethers } = hre;

const getUsdc = async () => {
  const provider = ethers.getDefaultProvider("http://localhost:8545");
  const [w1] = await ethers.getSigners();
  const w1EthBalance = await w1.getBalance();
  console.log("w1 eth bal: ", ethers.utils.formatEther(w1EthBalance));

  const whaleAddress = "0x0D2703ac846c26d5B6Bbddf1FD6027204F409785";

  const UsdcContract = new ethers.Contract(
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    usdcAbi,
    provider
  );

  let w1Balance = await UsdcContract.balanceOf(w1.address);
  console.log("w1Balance: ", ethers.utils.formatUnits(w1Balance, 6));

  let whaleBalance = await UsdcContract.balanceOf(whaleAddress);
  console.log("whaleBalance: ", ethers.utils.formatUnits(whaleBalance, 6));

  await await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whaleAddress],
  });
  const signer = await provider.getSigner(whaleAddress);

  let whaleEthBalance = await signer.getBalance();
  console.log(
    "whaleEthBalance: ",
    ethers.utils.formatUnits(whaleEthBalance, 18)
  );

  UsdcContract.connect(signer).transfer(
    w1.address,
    ethers.utils.parseUnits("100", 6)
  );

  w1Balance = await UsdcContract.balanceOf(w1.address);
  console.log("w1Balance: ", ethers.utils.formatUnits(w1Balance, 6));
};

getUsdc();
