/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */

const { waffle, ethers, upgrades, getChainId, network } = require("hardhat");
const { expect } = require("chai");
const moment = require("moment");
const usdcAbi = require("@scaffold-eth/react-app/src/contracts/ABI/IERC20.json");

const {
  utils: { formatEther, formatUnits, parseEther, parseUnits },
  provider: p,
  getContractFactory,
  constants,
  BigNumber,
} = ethers;

const { AddressZero } = constants;
const { deployProxy, upgradeProxy, erc1967 } = upgrades;

const { provider, loadFixture } = waffle;

describe("LeaderBoard", () => {
  const TODAYS_DATE = moment().utc().startOf("day").unix();
  const YESTERDAYS_DATE = moment.unix(TODAYS_DATE).subtract(1, "days").unix();
  const TOMORROWS_DATE = moment.unix(TODAYS_DATE).add(1, "days").unix();
  const DAY_BEFORE_YESTERDAY_DATE = moment
    .unix(TODAYS_DATE)
    .subtract(2, "days")
    .unix();

  const HUNDRED_DAYS_AGO_DATE = moment
    .unix(TODAYS_DATE)
    .subtract(100, "days")
    .unix();

  describe("v1", () => {
    const LeaderBoardFixture = async () => {
      console.log("*** in LeaderBoardFixture ***");
      const [w0, w1, w2] = provider.getWallets();
      const chainId = await getChainId();

      const LeaderBoardV1 = await ethers.getContractFactory("LeaderBoardV1");
      const leaderBoardV1 = await deployProxy(LeaderBoardV1, [], {
        kind: "uups",
      });
      await leaderBoardV1.deployed();
      return { leaderBoard: leaderBoardV1, w0, w1, w2 };
    };
    let leaderBoard;
    let w0;
    let w1;
    let w2;
    let sampleItem;
    let additionalSampleItem;

    beforeEach(async () => {
      const obj = await loadFixture(LeaderBoardFixture);
      leaderBoard = obj.leaderBoard;
      w2 = obj.w2;
      w1 = obj.w1;
      w0 = obj.w0;
      sampleItem = {
        submitter: AddressZero,
        imageUrl: "http://foo.com",
        clickUrl: "http://bar.com",
        title: "Heading 1",
        description: "Text 1",
        startTime: TODAYS_DATE,
        endTime: TOMORROWS_DATE,
        upVotes: BigNumber.from(0),
        id: BigNumber.from(0),
      };
      additionalSampleItem = {
        submitter: AddressZero,
        imageUrl: "http://foo5.com",
        clickUrl: "http://bar5.com",
        title: "Heading 5",
        description: "Text 5",
        startTime: TODAYS_DATE,
        endTime: TOMORROWS_DATE,
        upVotes: BigNumber.from(0),
        id: BigNumber.from(0),
      };
    });
    it("has a proxy address", () => {
      expect(leaderBoard.address).to.be.properAddress;
      expect(leaderBoard.address).to.not.be.eq(AddressZero);
    });
    it("has implementation address", async () => {
      const implAddr = await erc1967.getImplementationAddress(
        leaderBoard.address
      );
      expect(implAddr).to.be.properAddress;
      expect(implAddr).to.not.be.eq(AddressZero);
    });

    it("has an address ", async () => {
      expect(leaderBoard.address).to.be.properAddress;
    });

    it("has ItemIdCounter", async () => {
      const ans = await leaderBoard.ItemIdCounter();
      console.log(ans);
    });
    it("has 0 item count", async () => {
      const ans = await leaderBoard.itemsCount();
      console.log(ans);
      expect(ans).to.be.eq(0);
    });
    it("can add an item", async () => {
      console.log("going to add: ", sampleItem);
      await leaderBoard.connect(w0).addItem({ ...sampleItem });
    });
    it("can not add item when not admin", async () => {
      console.log("going to add: ", sampleItem);
      await expect(leaderBoard.connect(w1).addItem({ ...sampleItem })).to.be
        .reverted;
    });
    it("adding an item increases count", async () => {
      const countBefore = await leaderBoard.itemsCount();
      await leaderBoard.connect(w0).addItem({ ...sampleItem });
      await leaderBoard.connect(w0).addItem({ ...sampleItem });
      await leaderBoard.connect(w0).addItem({ ...sampleItem });
      const countAfter = await leaderBoard.itemsCount();
      expect(countAfter.sub(countBefore)).to.be.eq(3);
    });
    it("can access an item by its id", async () => {
      await leaderBoard.connect(w0).addItem({ ...sampleItem, title: "first" });
      await leaderBoard.connect(w0).addItem({ ...sampleItem, title: "second" });
      expect((await leaderBoard.itemsById(1)).title).to.be.eq("first");
      expect((await leaderBoard.itemsById(2)).title).to.be.eq("second");
    });
    it("added item gets submitters address and 0 upvote count", async () => {
      await leaderBoard
        .connect(w0)
        .addItem({ ...sampleItem, upVotes: BigNumber.from(10) });
      const item = await leaderBoard.itemsById(1);
      expect(item.upVotes).to.be.eq(0);
      expect(item.submitter).to.be.eq(w0.address);
    });
    it("can upvote", async () => {
      await leaderBoard.connect(w0).addItem({ ...sampleItem, title: "first" });
      let item;
      item = await leaderBoard.itemsById(1);
      expect(item.upVotes).to.be.eq(0);
      await leaderBoard.upVoteItem(1);
      item = await leaderBoard.itemsById(1);
      expect(item.upVotes).to.be.eq(1);
    });
    it("can upvote even when not admin", async () => {
      await leaderBoard.connect(w0).addItem({ ...sampleItem, title: "first" });
      let item;
      item = await leaderBoard.itemsById(1);
      expect(item.upVotes).to.be.eq(0);
      await leaderBoard.connect(w1).upVoteItem(1);
      item = await leaderBoard.itemsById(1);
      expect(item.upVotes).to.be.eq(1);
    });
    it("can not upvote even when paused", async () => {
      await leaderBoard.connect(w0).addItem({ ...sampleItem, title: "first" });
      await leaderBoard.connect(w0).pause();
      await expect(leaderBoard.connect(w1).upVoteItem(1)).to.be.reverted;
    });
    it("can edit an item", async () => {
      await leaderBoard.connect(w0).addItem({ ...sampleItem, title: "first" });
      await leaderBoard.connect(w0).upVoteItem(1);
      await leaderBoard.connect(w1).upVoteItem(1);
      await leaderBoard
        .connect(w0)
        .updateItem(1, { ...sampleItem, title: "foo" });
      const [item] = await leaderBoard.getAllItems();
      expect(item.upVotes).to.be.eq(2);
      expect(item.title).to.be.eq("foo");
    });
    it("can not add edit when not admin", async () => {
      await leaderBoard.connect(w0).addItem({ ...sampleItem, title: "first" });
      await expect(
        leaderBoard.connect(w1).updateItem(1, { ...sampleItem, title: "foo" })
      ).to.be.reverted;
    });
    it("can get items hash as array", async () => {
      await leaderBoard.connect(w0).addItem(sampleItem);
      await leaderBoard.connect(w0).addItem(additionalSampleItem);
      await leaderBoard.connect(w0).addItem({ ...sampleItem, title: "ha" });
      const allItems = await leaderBoard.getItemsByIdHashAsArray();
      expect(allItems.length).to.be.equal(3);
    });
    it("get all item ids", async () => {
      await leaderBoard.connect(w0).addItem(sampleItem);
      await leaderBoard.connect(w0).addItem(additionalSampleItem);
      await leaderBoard.connect(w0).addItem({ ...sampleItem, title: "ha" });
      const itemIds = await leaderBoard.getAllItemIds();
      console.log("itemIds: ", itemIds);
    });
    it("can get all items", async () => {
      await leaderBoard.connect(w0).addItem(sampleItem);
      await leaderBoard.connect(w0).addItem(additionalSampleItem);
      const allItems = await leaderBoard.getAllItems();
      expect(allItems.length).to.be.equal(2);
    });
    it("items have an id on them", async () => {
      await leaderBoard.connect(w0).addItem(sampleItem);
      await leaderBoard.connect(w0).addItem(additionalSampleItem);
      const [item1, item2] = await leaderBoard.getAllItems();
      expect(item1.id).to.be.eq(1);
      expect(item2.id).to.be.eq(2);
    });
    it("owner can pause", async () => {
      await expect(leaderBoard.connect(w0).pause()).to.not.be.reverted;
    });
    it("non owner can not pause", async () => {
      await expect(leaderBoard.connect(w1).pause()).to.be.reverted;
    });
    it("owner can unpause", async () => {
      await leaderBoard.connect(w0).pause();
      await expect(leaderBoard.connect(w0).unpause()).to.not.be.reverted;
    });
    it("non owner can not unpause", async () => {
      await leaderBoard.connect(w0).pause();
      await expect(leaderBoard.connect(w1).unpause()).to.be.reverted;
    });
  });
});
