/* eslint-disable no-unused-expressions */

const { waffle, ethers, network, getChainId } = require("hardhat"); // note waffle comes hardhat and not direct
const { expect } = require("chai");
const ShowcaseArtifacts = require("../artifacts/contracts/Showcase.sol/Showcase.json");
const moment = require("moment");

const {
  provider,
  deployContract,
  solidity,
  link,
  deployMockContract,
  createFixtureLoader,
  loadFixture,
} = waffle;

const {
  utils: { formatEther },
  provider: p,
  constants,
} = ethers;

console.log("Running showcaseTest.js: ", network.name, network.config.chainId);

describe("Showcase", () => {
  const TODAYS_DATE = moment().format("YYYY-MM-DD");
  const YESTERDAYS_DATE = moment().subtract(1, "days").format("YYYY-MM-DD");

  const showcaseFixture = async () => {
    const [w1] = provider.getWallets();
    const showcase = await deployContract(w1, ShowcaseArtifacts, []);
    return { showcase };
  };

  const showcaseWithPromotionFixture = async (promotionDate = TODAYS_DATE) => {
    const { showcase } = await loadFixture(showcaseFixture);
    const [w1] = provider.getWallets();

    const promotion = [
      w1.address,
      constants.AddressZero,
      1001,
      "http://alphaback.xyz",
      1,
      promotionDate,
      "foo",
      "foo bar",
      "localhost",
    ];
    await showcase.connect(w1).addPromotion(promotion);

    return { showcase, promotion };
  };

  it("has an address ", async () => {
    const { showcase } = await loadFixture(showcaseFixture);
    expect(showcase.address).to.be.properAddress;
  });

  it("has promotions", async () => {
    const { showcase } = await loadFixture(showcaseFixture);
    expect(showcase.promotions).to.not.be.undefined;
  });

  it("can add promotion", async () => {
    const { showcase } = await loadFixture(showcaseFixture);
    const [w1] = provider.getWallets();

    const promotion = [
      w1.address,
      constants.AddressZero,
      5,
      "http://foo.com",
      1,
      TODAYS_DATE,
      "foo",
      "foo bar",
      "localhost",
    ];
    await showcase.connect(w1).addPromotion(promotion);

    const promotionResult = await showcase.promotions(TODAYS_DATE);
    expect(promotionResult[0]).to.be.equal(promotion[0]); // check all values
  });

  it("gives address when promotion is present", async () => {
    const { showcase, promotion } = await loadFixture(
      showcaseWithPromotionFixture
    );
    const promotionResult = await showcase.promotions(TODAYS_DATE);
    expect(promotionResult[0]).to.be.equal(promotion[0]);
  });

  it("gives 0 when promotion is not present", async () => {
    const { showcase, promotion } = await loadFixture(
      showcaseWithPromotionFixture
    );
    const promotionResult = await showcase.promotions(YESTERDAYS_DATE);
    expect(promotionResult[0]).to.not.be.equal(promotion[0]);
    expect(promotionResult[0]).to.be.equal(constants.AddressZero);
  });

  it("gives promotion date as string when promotion present", async () => {
    const { showcase, promotion } = await loadFixture(
      showcaseWithPromotionFixture
    );
    const promotionResult = await showcase.promotions(TODAYS_DATE);
    expect(promotionResult[5]).to.be.equal(promotion[5]);
  });

  it("gives promotion date as empty string when promotion not present", async () => {
    const { showcase, promotion } = await loadFixture(
      showcaseWithPromotionFixture
    );
    const promotionResult = await showcase.promotions(YESTERDAYS_DATE);
    expect(promotionResult[5]).to.not.be.equal(promotion[5]);
    expect(promotionResult[5]).to.be.equal("");
  });
});
