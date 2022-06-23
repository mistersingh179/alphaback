/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */

const { waffle, ethers, network, getChainId } = require("hardhat"); // note waffle comes hardhat and not direct
const { expect } = require("chai");
const ShowcaseArtifacts = require("../artifacts/contracts/Showcase.sol/Showcase.json");
const moment = require("moment");
const { load } = require("dotenv");

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

  const showcaseWithManyPromotionsFixture = async () => {
    const { showcase } = await loadFixture(showcaseFixture);
    const [w1] = provider.getWallets();

    const promotions = [...Array(10)].map((elem, idx) => {
      const promotionDate = moment().subtract(idx, "days");
      return {
        promoter: w1.address,
        nftContractAddress: constants.AddressZero,
        nftTokenId: idx,
        clickThruUrl: "https://foo.com",
        amount: "1000",
        date: promotionDate.format("YYYY-MM-DD"),
        title: "Foo",
        subTitle: "Foobar",
        networkName: "mainnet",
      };
    });
    for (let i = 0; i < promotions.length; i += 1) {
      await showcase.connect(w1).addPromotion(promotions[i]);
    }

    return { showcase, promotions };
  };

  it("has an address ", async () => {
    const { showcase } = await loadFixture(showcaseFixture);
    expect(showcase.address).to.be.properAddress;
  });

  it("has promotions", async () => {
    const { showcase } = await loadFixture(showcaseFixture);
    expect(showcase.promotions).to.not.be.undefined;
  });

  it("has many promotions", async () => {
    const { showcase } = await loadFixture(showcaseWithManyPromotionsFixture);

    let promotion = await showcase.promotions(moment().format("YYYY-MM-DD"));
    expect(promotion.promoter).not.to.be.equal(constants.AddressZero);

    promotion = await showcase.promotions(
      moment().subtract(1, "days").format("YYYY-MM-DD")
    );
    expect(promotion.promoter).not.to.be.equal(constants.AddressZero);

    promotion = await showcase.promotions(
      moment().subtract(2, "days").format("YYYY-MM-DD")
    );
    expect(promotion.promoter).not.to.be.equal(constants.AddressZero);
  });

  it("gives 0 address when no promotion", async () => {
    const { showcase } = await loadFixture(showcaseWithManyPromotionsFixture);

    const promotion = await showcase.promotions(
      moment().subtract(1000, "days").format("YYYY-MM-DD")
    );
    expect(promotion.promoter).to.be.equal(constants.AddressZero);
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

  describe.only("gets 2 Promotions", () => {
    it("can give back multiple promotions", async () => {
      const { showcase } = await loadFixture(showcaseWithManyPromotionsFixture);
      const d1 = moment().subtract(1, "days").format("YYYY-MM-DD");
      const d2 = moment().subtract(2, "days").format("YYYY-MM-DD");
      // const d3 = moment().subtract(3, "days").format("YYYY-MM-DD");
      const promos = await showcase.getMultiplePromotions([d1, d2]);
      expect(promos.length).to.be.equal(2);
    });
    it("can give back multiple promotions", async () => {
      const { showcase } = await loadFixture(showcaseWithManyPromotionsFixture);
      const d1 = moment().subtract(1, "days").format("YYYY-MM-DD");
      const d2 = moment().subtract(2, "days").format("YYYY-MM-DD");
      const d3 = moment().subtract(3, "days").format("YYYY-MM-DD");
      const promos = await showcase.getMultiplePromotions([d1, d2, d3]);
      expect(promos.length).to.be.equal(3);
    });
    it("has promotion attributes in each promotion", async () => {
      const { showcase } = await loadFixture(showcaseWithManyPromotionsFixture);
      const d1 = moment().subtract(1, "days").format("YYYY-MM-DD");
      const d2 = moment().subtract(2, "days").format("YYYY-MM-DD");
      const promos = await showcase.getMultiplePromotions([d1, d2]);
      expect(promos[0].promoter).to.not.be.eq(constants.AddressZero);
      expect(promos[1].promoter).to.not.be.eq(constants.AddressZero);
    });
    it("has empty promotion attributes for missing promotion date", async () => {
      const { showcase } = await loadFixture(showcaseWithManyPromotionsFixture);
      const d1 = moment().subtract(1000, "days").format("YYYY-MM-DD");
      const d2 = moment().subtract(2, "days").format("YYYY-MM-DD");
      const promos = await showcase.getMultiplePromotions([d1, d2]);
      expect(promos[0].promoter).to.be.eq(constants.AddressZero);
      expect(promos[1].promoter).to.not.be.eq(constants.AddressZero);
    });
  });
});
