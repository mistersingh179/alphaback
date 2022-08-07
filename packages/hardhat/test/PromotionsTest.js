/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */

const { waffle, ethers, upgrades, getChainId, network } = require("hardhat");
const { expect } = require("chai");
const moment = require("moment");
const usdcAbi = require("../../react-app/src/contracts/ABI/IERC20.json");

const {
  utils: { formatEther, formatUnits, parseEther, parseUnits },
  provider: p,
  getContractFactory,
  constants,
  BigNumber,
} = ethers;

const { AddressZero } = constants;
const { deployProxy, upgradeProxy, erc1967 } = upgrades;

const {
  provider,
  deployContract,
  solidity,
  link,
  deployMockContract,
  createFixtureLoader,
  loadFixture,
} = waffle;

describe.only("Promotions", () => {
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

  console.log(
    "TODAYS_DATE: ",
    TODAYS_DATE,
    moment.unix(TODAYS_DATE).utc().format("YYYY-MM-DD")
  );

  const usdcWhaleAddress = "0x72a53cdbbcc1b9efa39c834a540550e23463aacb";

  describe("v1", () => {
    const promotionsFixture = async () => {
      console.log("*** in nftPromotionFixture ***");
      const [w0, w1, w2] = provider.getWallets();
      const chainId = await getChainId();
      let usdcAddress = ethers.constants.AddressZero;
      if (chainId === "31337") {
        usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // from mainnet
      } else if (chainId === "80001") {
        usdcAddress = "0x0fa8781a83e46826621b3bc094ea2a0212e71b23";
      } else if (chainId === "137") {
        usdcAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
      }

      const PromotionsV1 = await ethers.getContractFactory("PromotionsV1");
      const promotionsV1 = await deployProxy(PromotionsV1, [usdcAddress], {
        kind: "uups",
      });
      await promotionsV1.deployed();

      await provider.send("hardhat_impersonateAccount", [usdcWhaleAddress]);
      const usdcWhaleSigner = await provider.getSigner(usdcWhaleAddress);
      await w1.sendTransaction({
        to: usdcWhaleAddress,
        value: parseEther("1.0"),
      });
      const usdcContract = new ethers.Contract(
        usdcAddress,
        usdcAbi,
        provider
      ).connect(usdcWhaleSigner);
      const whaleUsdcBal = await usdcContract.balanceOf(usdcWhaleAddress);
      console.log("usdc bal of whale is: ", formatUnits(whaleUsdcBal, 6));
      const largelAmount = ethers.BigNumber.from(2).pow(256).sub(1);
      for (let i = 0; i < [w0, w1, w2].length; i += 1) {
        const w = [w0, w1, w2][i];
        console.log("setting up wallet: ", w.address);
        await usdcContract
          .connect(w)
          .approve(promotionsV1.address, largelAmount);
        await usdcContract.transfer(w.address, parseUnits("1000000", 6));
        const usdcBal = await usdcContract.balanceOf(w.address);
        console.log(w.address, "has USDC: ", formatUnits(usdcBal, 6));
      }
      console.log(
        "*** evm_setNextBlockTimestamp: ",
        moment.utc().unix(),
        moment.utc().format()
      );
      await network.provider.send("evm_setNextBlockTimestamp", [
        moment.utc().unix(),
      ]);
      await network.provider.send("evm_mine");
      return { showcase: promotionsV1, w0, w1, w2, usdcContract };
    };
    describe("without any promotion", () => {
      let showcase;
      let w0;
      let w1;
      let w2;
      let usdcContract;
      let samplePromotion;

      beforeEach(async () => {
        const obj = await loadFixture(promotionsFixture);
        showcase = obj.showcase;
        w2 = obj.w2;
        w1 = obj.w1;
        w0 = obj.w0;
        usdcContract = obj.usdcContract;
        samplePromotion = [
          w1.address,
          constants.AddressZero,
          5,
          "http://foo.com",
          45,
          TODAYS_DATE,
          "foo",
          "foo bar",
          "localhost",
          "",
          0,
        ];
      });

      it("has a proxy address", () => {
        expect(showcase.address).to.be.properAddress;
        expect(showcase.address).to.not.be.eq(AddressZero);
      });
      it("has implementation address", async () => {
        const implAddr = await erc1967.getImplementationAddress(
          showcase.address
        );
        expect(implAddr).to.be.properAddress;
        expect(implAddr).to.not.be.eq(AddressZero);
      });

      it("has an address ", async () => {
        expect(showcase.address).to.be.properAddress;
      });

      it("has promotions", async () => {
        expect(showcase.promotions).to.not.be.undefined;
      });

      it("can add promotion", async () => {
        await showcase.connect(w1).addPromotion(samplePromotion);

        const promotionResult = await showcase.promotions(TODAYS_DATE);
        expect(promotionResult[0]).to.be.equal(samplePromotion[0]); // check all values
      });

      it("sets promoter to sender in promotion", async () => {
        await showcase.connect(w1).addPromotion(samplePromotion);

        const promotionResult = await showcase.promotions(TODAYS_DATE);
        expect(promotionResult.promoter).to.be.equal(w1.address);

        const anotherPromo = [...samplePromotion];
        anotherPromo[5] = TOMORROWS_DATE;
        await showcase.connect(w2).addPromotion(anotherPromo);

        const promotionResult2 = await showcase.promotions(TOMORROWS_DATE);
        expect(promotionResult2.promoter).to.be.equal(w2.address);
      });

      it("can update your promotion", async () => {
        const origPromotion = [...samplePromotion];
        origPromotion[3] = "http://a.com";
        await showcase.connect(w1).addPromotion(origPromotion);
        const origPromo = await showcase.promotions(TODAYS_DATE);
        expect(origPromo.clickThruUrl).to.be.equal("http://a.com");

        const updatedPromotion = [...samplePromotion];
        updatedPromotion[3] = "http://b.com";
        await showcase.connect(w1).updatePromotion(updatedPromotion);
        const updatedPromo = await showcase.promotions(TODAYS_DATE);
        expect(updatedPromo.clickThruUrl).to.be.equal("http://b.com");
      });

      it("reverts when trying update someone elses promotion", async () => {
        const origPromotion = [...samplePromotion];
        origPromotion[3] = "http://a.com";
        await showcase.connect(w1).addPromotion(origPromotion);
        const origPromo = await showcase.promotions(TODAYS_DATE);
        expect(origPromo.clickThruUrl).to.be.equal("http://a.com");

        const updatedPromotion = [...samplePromotion];
        updatedPromotion[3] = "http://b.com";
        await expect(showcase.connect(w2).updatePromotion(updatedPromotion)).to
          .be.reverted;
      });

      it("owner can update anyones promotion", async () => {
        const origPromotion = [...samplePromotion];
        origPromotion[3] = "http://a.com";
        await showcase.connect(w1).addPromotion(origPromotion);
        const origPromo = await showcase.promotions(TODAYS_DATE);
        expect(origPromo.clickThruUrl).to.be.equal("http://a.com");

        const updatedPromotion = [...samplePromotion];
        updatedPromotion[3] = "http://abcdef.com";
        await expect(showcase.connect(w0).updatePromotion(updatedPromotion)).to
          .not.be.reverted;
        const updatedPromo = await showcase.promotions(TODAYS_DATE);
        expect(updatedPromo.clickThruUrl).to.be.equal("http://abcdef.com");
      });

      xit("can not add a promotion in past", async () => {
        samplePromotion[5] = YESTERDAYS_DATE;
        await expect(showcase.connect(w1).addPromotion(samplePromotion)).to.be
          .reverted;
      });

      xit("can not add a promotion even one second before start of today", async () => {
        const startOfToday = moment().utc().startOf("day");
        samplePromotion[5] = startOfToday.subtract(1, "second").unix();
        await expect(showcase.connect(w1).addPromotion(samplePromotion)).to.be
          .reverted;
      });

      it("can add a promotion at start of today", async () => {
        const startOfToday = moment().utc().startOf("day");
        samplePromotion[5] = startOfToday.unix();
        await expect(showcase.connect(w1).addPromotion(samplePromotion)).to.not
          .be.reverted;
      });

      describe("can access promo cost", () => {
        it("promo cost is given as default cost", async () => {
          await showcase.connect(w1).addPromotion(samplePromotion);
          const defaultCost = await showcase.defaultCost();
          expect((await showcase.promotions(TODAYS_DATE)).amount).to.eq(
            defaultCost
          );
        });

        it("promo cost is given as that days cost", async () => {
          await showcase.connect(w0).setDayCost(TODAYS_DATE, 500_000_000);
          await showcase.connect(w1).addPromotion(samplePromotion);
          expect((await showcase.promotions(TODAYS_DATE)).amount).to.eq(
            500_000_000
          );
        });

        it("promo cost is default cost when day set later", async () => {
          await showcase.connect(w1).addPromotion(samplePromotion);
          await showcase.connect(w0).setDayCost(TODAYS_DATE, 500_000_000);
          const defaultCost = await showcase.defaultCost();
          expect((await showcase.promotions(TODAYS_DATE)).amount).to.eq(
            defaultCost
          );
        });

        it("promo cost is original default cost when default cost changed later", async () => {
          const defaultCost = await showcase.defaultCost();
          await showcase.connect(w1).addPromotion(samplePromotion);
          await showcase.connect(w0).setDefaultCost(22);
          expect((await showcase.promotions(TODAYS_DATE)).amount).to.eq(
            defaultCost
          );
        });
        it("promo cost is new default cost when default cost is changed before", async () => {
          const defaultCost = await showcase.defaultCost();
          await showcase.connect(w0).setDefaultCost(22);
          await showcase.connect(w1).addPromotion(samplePromotion);
          expect((await showcase.promotions(TODAYS_DATE)).amount).to.eq(22);
        });

        it("amount set on promo is not what is passed in", async () => {
          await showcase.connect(w1).addPromotion(samplePromotion);
          expect((await showcase.promotions(TODAYS_DATE)).amount).to.not.be.eq(
            45
          );
        });

        it("amount set on promo is what is charged in", async () => {
          const defaultCost = await showcase.defaultCost();
          await showcase.connect(w1).addPromotion(samplePromotion);
          expect((await showcase.promotions(TODAYS_DATE)).amount).to.be.eq(
            defaultCost
          );
        });
      });

      describe("charges to add promotions", () => {
        it("rejects adding promotion when missing funds", async () => {
          const OneMillion = 1_000_000_000;
          await showcase.setDayCost(TODAYS_DATE, OneMillion * 10 ** 6);
          await expect(showcase.connect(w1).addPromotion(samplePromotion)).to.be
            .reverted;
        });

        it("charges 1 based on the days cost", async () => {
          await showcase.setDayCost(TODAYS_DATE, 1);
          const w1BalanceBefore = await usdcContract.balanceOf(w1.address);
          await showcase.connect(w1).addPromotion(samplePromotion);
          const w1BalanceAfter = await usdcContract.balanceOf(w1.address);
          expect(w1BalanceBefore.sub(w1BalanceAfter)).to.be.eq(1);
        });

        it("charges 2 based on the days cost", async () => {
          await showcase.setDayCost(TODAYS_DATE, 2);
          const w1BalanceBefore = await usdcContract.balanceOf(w1.address);
          await showcase.connect(w1).addPromotion(samplePromotion);
          const w1BalanceAfter = await usdcContract.balanceOf(w1.address);
          expect(w1BalanceBefore.sub(w1BalanceAfter)).to.be.eq(2);
        });

        it("charges default when no day cost", async () => {
          const w1BalanceBefore = await usdcContract.balanceOf(w1.address);
          await showcase.connect(w1).addPromotion(samplePromotion);
          const w1BalanceAfter = await usdcContract.balanceOf(w1.address);
          expect(w1BalanceAfter).to.be.lt(w1BalanceBefore);
          const defaultCost = await showcase.defaultCost();
          expect(w1BalanceBefore.sub(w1BalanceAfter)).to.be.eq(defaultCost);
        });

        it("can not change price if not owner", async () => {
          await expect(showcase.connect(w1).setDayCost(TODAYS_DATE, 1)).to.be
            .reverted;
        });

        it("can change price if owner", async () => {
          await expect(showcase.connect(w0).setDayCost(TODAYS_DATE, 1)).to.not
            .be.reverted;
        });

        it("contract grows in funds", async () => {
          const balBefore = await usdcContract.balanceOf(showcase.address);
          const defaultCost = await showcase.defaultCost();
          await showcase.connect(w1).addPromotion(samplePromotion);
          const balAfter = await usdcContract.balanceOf(showcase.address);
          expect(balAfter.sub(balBefore)).to.be.equal(
            defaultCost.mul(7).div(10)
          );
        });

        it("can withdraw if owner", async () => {
          await showcase.connect(w1).addPromotion(samplePromotion);
          const showcaseBal = await usdcContract.balanceOf(showcase.address);
          expect(showcaseBal).to.be.gt(0);
          const w0BalBefore = await usdcContract.balanceOf(w0.address);
          await showcase.connect(w0).withdraw(showcaseBal);
          const w0BalAfter = await usdcContract.balanceOf(w0.address);
          expect(w0BalAfter.sub(w0BalBefore)).to.be.eq(showcaseBal);
        });

        it("can not withdraw if not owner", async () => {
          await showcase.connect(w1).addPromotion(samplePromotion);
          await expect(showcase.connect(w1).withdraw(1)).to.be.reverted;
        });

        it("is free for deployer account", async () => {
          const showcaseBalBefore = await usdcContract.balanceOf(
            showcase.address
          );
          expect(showcaseBalBefore).to.be.eq(0);
          await showcase.connect(w0).addPromotion(samplePromotion);
          const showcaseBalAfter = await usdcContract.balanceOf(
            showcase.address
          );
          expect(showcaseBalAfter).to.be.eq(0);
        });

        it("is not free for non deployer account", async () => {
          const showcaseBalBefore = await usdcContract.balanceOf(
            showcase.address
          );
          expect(showcaseBalBefore).to.be.eq(0);
          await showcase.connect(w1).addPromotion(samplePromotion);
          const showcaseBalAfter = await usdcContract.balanceOf(
            showcase.address
          );
          expect(showcaseBalAfter).to.be.gt(0);
        });

        it("sends 30% to admin", async () => {
          await showcase.setDefaultCost(99);
          const origBal = await usdcContract.balanceOf(w0.address);
          await showcase.connect(w1).addPromotion(samplePromotion);
          const newBal = await usdcContract.balanceOf(w0.address);
          expect(newBal.sub(origBal)).to.be.equal(
            BigNumber.from(99).mul(3).div(10)
          );
        });

        it("keeps 70% in contract for members to withdraw", async () => {
          await showcase.setDefaultCost(99);
          const origBal = await usdcContract.balanceOf(showcase.address);
          await showcase.connect(w1).addPromotion(samplePromotion);
          const newBal = await usdcContract.balanceOf(showcase.address);
          expect(newBal.sub(origBal)).to.be.closeTo(
            BigNumber.from(99).mul(7).div(10),
            1
          );
        });
      });

      describe("without any members", () => {
        let addresses = [];
        let balances = [];
        before(async () => {
          addresses = [...Array(5)].map((item, idx) => {
            return ethers.Wallet.createRandom().address;
          });
          signupDates = [...Array(5)].map((item, idx) => TODAYS_DATE);
        });
        // cost for 5 - 387764
        // cost for 6 - 455942
        // cost for 7 - 524120
        // cost is 68K
        it("can add a member with owner wallet", async () => {
          await expect(showcase.connect(w0).addMembers(addresses, signupDates))
            .to.not.be.reverted;
        });
        it("can NOT add a member without owner wallet", async () => {
          await expect(showcase.connect(w1).addMembers(addresses, signupDates))
            .to.be.reverted;
        });
      });

      describe("with 5 members each of them last paid 10 days ago.", () => {
        let wallets;
        let addresses;
        let lastPayoutDates;
        let lastPayoutDate;
        let now;
        let sequentialDates;

        beforeEach(async () => {
          // samplePromotion[10] = 5;
          lastPayoutDate = moment().utc().startOf("day").subtract(10, "days");
          now = moment().utc().startOf("day");

          const numOfDays = moment
            .duration(now.diff(lastPayoutDate))
            .as("days");
          sequentialDates = [];
          for (let i = 1; i <= numOfDays; i++) {
            sequentialDates.push(lastPayoutDate.clone().add(i, "days").unix());
          }

          wallets = [...Array(5)].map(() =>
            ethers.Wallet.createRandom().connect(provider)
          );
          for (let w of wallets) {
            await w1.sendTransaction({
              to: w.address,
              value: parseEther("1.0"),
            });
          }
          addresses = wallets.map((w) => w.address);
          lastPayoutDates = [...Array(5)].map(() => lastPayoutDate.unix());
          console.log(
            "inserted last payout date to be: ",
            lastPayoutDates[0],
            moment.unix(lastPayoutDates[0]).utc().format()
          );
          await showcase.addMembers(addresses, lastPayoutDates);
        });

        it("has 5 members", async () => {
          expect(await showcase.membersCount()).to.be.eq(5);
        });

        it("can get all 5 members", async () => {
          const count = await showcase.membersCount();
          const members = [];
          for (let i = 0; i < count; i++) {
            members[i] = await showcase.memberAtIndex(i);
            console.log(members[i]);
            expect(members[i][0]).to.not.be.equal(constants.AddressZero);
          }
        });

        it("reverts for members which dont exist", async () => {
          await expect(showcase.memberAtIndex(5)).to.be.reverted;
        });

        describe("memberBalance", () => {
          it("gives 0 balance when no promos ", async () => {
            const [bal] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(bal).to.be.eq(0);
          });

          it("gives positive balance if promo has ran", async () => {
            const oneDayOldPromo = [...samplePromotion];
            const yesterday = moment()
              .utc()
              .startOf("day")
              .subtract(1, "days")
              .unix();
            oneDayOldPromo[5] = yesterday;
            await showcase.connect(w1).addPromotion(oneDayOldPromo);
            const [bal] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(await bal).to.be.gt(0);
          });

          it("gives balance proportional to the number of members", async () => {
            await showcase.setDefaultCost(100);

            const oneDayOldPromo = [...samplePromotion];
            const yesterday = moment()
              .utc()
              .startOf("day")
              .subtract(1, "days")
              .unix();
            oneDayOldPromo[5] = yesterday;

            await showcase.connect(w1).addPromotion(oneDayOldPromo);
            const [bal] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(await bal).to.be.eq((100 * 0.7) / 5);
          });

          it("reverts if member doesn't exist", async () => {
            const oneDayOldPromo = [...samplePromotion];
            const yesterday = moment()
              .utc()
              .startOf("day")
              .subtract(1, "days")
              .unix();
            oneDayOldPromo[5] = yesterday;
            await showcase.connect(w1).addPromotion(oneDayOldPromo);

            const todayPromo = [...samplePromotion];
            todayPromo[5] = moment().utc().startOf("day").unix();
            await showcase.connect(w1).addPromotion(todayPromo);

            const newWallet = ethers.Wallet.createRandom();
            await expect(
              showcase.memberBalance(newWallet.address, sequentialDates)
            ).to.be.reverted;
          });

          it("gives 0 balance if signed up after promo ", async () => {
            const oldPromo = [...samplePromotion];
            oldPromo[5] = moment()
              .utc()
              .startOf("day")
              .subtract(20, "days")
              .unix();
            await showcase.connect(w1).addPromotion(oldPromo);
            const [bal] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(bal).to.be.eq(0);
          });

          it("does not count past promos for balance", async () => {
            const hundredDayOldPromo = [...samplePromotion];
            hundredDayOldPromo[5] = moment()
              .utc()
              .startOf("day")
              .subtract(100, "days")
              .unix();
            await showcase.connect(w1).addPromotion(hundredDayOldPromo);

            const yesterdayPromo = [...samplePromotion];
            yesterdayPromo[5] = moment()
              .utc()
              .startOf("day")
              .subtract(1, "days")
              .unix();
            await showcase.connect(w1).addPromotion(yesterdayPromo);

            const todayPromo = [...samplePromotion];
            todayPromo[5] = moment().utc().startOf("day").unix();
            await showcase.connect(w1).addPromotion(todayPromo);

            const defaultCost = await showcase.defaultCost();
            const expectBal = defaultCost
              .add(defaultCost)
              .mul(7)
              .div(10)
              .div(5);
            const [bal] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(bal).to.be.eq(expectBal);
          });

          it("does not count future promos for balance", async () => {
            const todayPromo = [...samplePromotion];
            todayPromo[5] = moment().utc().startOf("day").unix();
            await showcase.connect(w1).addPromotion(todayPromo);

            const tomorrowPromo = [...samplePromotion];
            tomorrowPromo[5] = moment()
              .utc()
              .startOf("day")
              .add(1, "days")
              .unix();
            await showcase.connect(w1).addPromotion(tomorrowPromo);

            const dayAfterTomorrowPromo = [...samplePromotion];
            dayAfterTomorrowPromo[5] = moment()
              .utc()
              .startOf("day")
              .add(2, "days")
              .unix();
            await showcase.connect(w1).addPromotion(dayAfterTomorrowPromo);

            const defaultCost = (await showcase.defaultCost())
              .mul(7)
              .div(10)
              .div(5);

            const [bal] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(bal).to.be.eq(defaultCost);
          });

          it("uses default cost & day cost to calculate balance while ignoring old & future promos", async () => {
            await showcase.setDefaultCost(100);

            const hundredDayOldPromo = [...samplePromotion];
            hundredDayOldPromo[5] = moment()
              .utc()
              .startOf("day")
              .subtract(100, "days")
              .unix();
            await showcase.connect(w1).addPromotion(hundredDayOldPromo);

            const yesterdayPromo = [...samplePromotion];
            yesterdayPromo[5] = moment()
              .utc()
              .startOf("day")
              .subtract(1, "days")
              .unix();
            await showcase.setDayCost(yesterdayPromo[5], 10);
            await showcase.connect(w1).addPromotion(yesterdayPromo);

            const todayPromo = [...samplePromotion];
            todayPromo[5] = moment().utc().startOf("day").unix();
            await showcase.connect(w1).addPromotion(todayPromo);

            const tomorrowPromo = [...samplePromotion];
            tomorrowPromo[5] = moment()
              .utc()
              .startOf("day")
              .add(1, "days")
              .unix();
            await showcase.connect(w1).addPromotion(tomorrowPromo);
            const [bal] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(bal).to.be.eq(BigNumber.from(110).mul(7).div(10).div(5));
          });
        });

        describe("memberWithdrawBalance", () => {
          it("makes balance 0, usdc balance positive & resets date to latest date sent", async () => {
            await showcase.setDefaultCost(101);

            const yesterdayPromo = [...samplePromotion];
            yesterdayPromo[5] = moment()
              .utc()
              .startOf("day")
              .subtract(1, "days")
              .unix();

            const [bal] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(bal).to.be.eq(0);

            await showcase.connect(w1).addPromotion(yesterdayPromo);

            const [updateBal] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            console.log("*** updateBal: ", updateBal.toString());
            expect(updateBal).to.be.eq(
              BigNumber.from(101).mul(7).div(10).div(5)
            );
            expect(await usdcContract.balanceOf(addresses[0])).to.be.equal(0);
            expect(
              (await showcase.getMembersLastPayoutDate([addresses[0]]))[0]
            ).to.not.be.eq(now.unix());

            await showcase
              .connect(wallets[0])
              .memberWithdrawBalance(sequentialDates);

            const [balAfterWithdrawl] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(balAfterWithdrawl).to.be.eq(0);
            expect(await usdcContract.balanceOf(addresses[0])).to.be.eq(
              BigNumber.from(101).mul(7).div(10).div(5)
            );
            expect(
              (await showcase.getMembersLastPayoutDate([addresses[0]]))[0]
            ).to.be.eq(now.unix());
          });

          it("balance stays put for members which dont withdraw", async () => {
            await showcase.setDefaultCost(100);

            const yesterdayPromo = [...samplePromotion];
            yesterdayPromo[5] = moment()
              .utc()
              .startOf("day")
              .subtract(1, "days")
              .unix();

            await showcase.connect(w1).addPromotion(yesterdayPromo);
            const [bal0] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(bal0).to.be.eq(BigNumber.from(100).mul(7).div(10).div(5));
            const [bal1] = await showcase.memberBalance(
              addresses[1],
              sequentialDates
            );
            expect(bal1).to.be.eq(BigNumber.from(100).mul(7).div(10).div(5));

            await showcase
              .connect(wallets[0])
              .memberWithdrawBalance(sequentialDates);

            const [bal0After] = await showcase.memberBalance(
              addresses[0],
              sequentialDates
            );
            expect(bal0After).to.be.eq(0);
            const [bal1After] = await showcase.memberBalance(
              addresses[1],
              sequentialDates
            );
            expect(bal1After).to.be.eq(
              BigNumber.from(100).mul(7).div(10).div(5)
            );
          });

          it("accumulates the balance so each wallet can withdraw at schedule", async () => {
            await showcase.setDefaultCost(100);

            const yesterdayPromo = [...samplePromotion];
            yesterdayPromo[5] = moment()
              .utc()
              .startOf("day")
              .subtract(1, "days")
              .unix();

            const fivesDayAgoPromo = [...samplePromotion];
            fivesDayAgoPromo[5] = moment()
              .utc()
              .startOf("day")
              .subtract(5, "days")
              .unix();

            await showcase.connect(w1).addPromotion(fivesDayAgoPromo);

            expect(
              (await showcase.memberBalance(addresses[0], sequentialDates))[0]
            ).to.be.eq(BigNumber.from(100).mul(7).div(10).div(5));
            expect(
              (await showcase.memberBalance(addresses[1], sequentialDates))[0]
            ).to.be.eq(BigNumber.from(100).mul(7).div(10).div(5));

            const fiveDaysAgo = moment()
              .utc()
              .startOf("day")
              .subtract(5, "days");
            const numOfDays = moment
              .duration(fiveDaysAgo.diff(lastPayoutDate))
              .as("days");
            const seqFromLastToFiveDaysAgo = [];
            for (let i = 1; i <= numOfDays; i++) {
              seqFromLastToFiveDaysAgo.push(
                lastPayoutDate.clone().add(i, "days").unix()
              );
            }

            await showcase
              .connect(wallets[0])
              .memberWithdrawBalance(seqFromLastToFiveDaysAgo);

            expect(
              (await showcase.memberBalance(addresses[0], sequentialDates))[0]
            ).to.be.eq(0);
            expect(
              (await showcase.memberBalance(addresses[1], sequentialDates))[0]
            ).to.be.eq(BigNumber.from(100).mul(7).div(10).div(5));

            await showcase.connect(w1).addPromotion(yesterdayPromo);

            expect(
              (await showcase.memberBalance(addresses[1], sequentialDates))[0]
            ).to.be.eq(BigNumber.from(200).mul(7).div(10).div(5));
            expect(
              (await showcase.memberBalance(addresses[0], sequentialDates))[0]
            ).to.be.eq(BigNumber.from(100).mul(7).div(10).div(5));

            await showcase
              .connect(wallets[0])
              .memberWithdrawBalance(sequentialDates);
            await showcase
              .connect(wallets[1])
              .memberWithdrawBalance(sequentialDates);

            expect(
              (await showcase.memberBalance(addresses[0], sequentialDates))[0]
            ).to.be.eq(0);
            expect(
              (await showcase.memberBalance(addresses[1], sequentialDates))[0]
            ).to.be.eq(0);

            expect(await usdcContract.balanceOf(addresses[0])).to.be.eq(
              BigNumber.from(200).mul(7).div(10).div(5)
            );
            expect(await usdcContract.balanceOf(addresses[1])).to.be.eq(
              BigNumber.from(200).mul(7).div(10).div(5)
            );
          });
          it("reverts if a non member tries to withdraw", async () => {
            const yesterdayPromo = [...samplePromotion];
            yesterdayPromo[5] = moment()
              .utc()
              .startOf("day")
              .subtract(1, "days")
              .unix();

            await showcase.connect(w1).addPromotion(yesterdayPromo);
            await expect(showcase.memberWithdrawBalance(sequentialDates)).to.be
              .reverted;
          });
        });
      });

      describe("with 2 members, first one created 10 days and second 5 days ago", () => {
        let walletTenDayOld;
        let walletFiveDayOld;
        let now = moment().utc().startOf("day");
        let TenDayAgo = now.clone().subtract(10, "days");
        let SevenDayAgo = now.clone().subtract(7, "days");
        let FiveDayAgo = now.clone().subtract(5, "days");
        let ThreeDayAgo = now.clone().subtract(3, "days");

        const numOfDays = moment.duration(now.diff(TenDayAgo)).as("days");
        sequentialDates = [];
        for (let i = 1; i <= numOfDays; i++) {
          sequentialDates.push(TenDayAgo.clone().add(i, "days").unix());
        }

        beforeEach(async () => {
          walletTenDayOld = ethers.Wallet.createRandom().connect(provider);
          walletFiveDayOld = ethers.Wallet.createRandom().connect(provider);

          await w1.sendTransaction({
            to: walletTenDayOld.address,
            value: parseEther("1.0"),
          });
          await w1.sendTransaction({
            to: walletFiveDayOld.address,
            value: parseEther("1.0"),
          });

          await showcase.setDefaultCost(100);
        });

        it("gives less balance for member which joins late", async () => {
          const sevenDayOldPromo = [...samplePromotion];
          sevenDayOldPromo[5] = SevenDayAgo.unix();
          const threeDayOldPromo = [...sevenDayOldPromo];
          threeDayOldPromo[5] = ThreeDayAgo.unix();

          await showcase
            .connect(w0)
            .addMembers([walletTenDayOld.address], [TenDayAgo.unix()]);
          await showcase.connect(w1).addPromotion(sevenDayOldPromo);
          await showcase
            .connect(w0)
            .addMembers([walletFiveDayOld.address], [FiveDayAgo.unix()]);
          await showcase.connect(w1).addPromotion(threeDayOldPromo);

          expect(
            (
              await showcase.memberBalance(
                walletTenDayOld.address,
                sequentialDates
              )
            )[0]
          ).to.be.eq(105);
          expect(
            (
              await showcase.memberBalance(
                walletFiveDayOld.address,
                sequentialDates
              )
            )[0]
          ).to.be.eq(35);
        });
;
        it("can remove members", async () => {
          await showcase
            .connect(w0)
            .addMembers([walletTenDayOld.address], [TenDayAgo.unix()]);
          const origCount = await showcase.membersCount();
          expect(origCount).to.be.eq(1);
          await showcase.connect(w0).removeMembers([walletTenDayOld.address]);
          const newCount = await showcase.membersCount();
          expect(newCount).to.be.eq(0);
        });

        it("emits Member Addess & MemberRemoved when member is added or removed", async () => {
          await expect(
            showcase
              .connect(w0)
              .addMembers([walletTenDayOld.address], [TenDayAgo.unix()])
          )
            .to.emit(showcase, "MemberAdded")
            .withArgs(walletTenDayOld.address, TenDayAgo.unix());
          await expect(
            showcase.connect(w0).removeMembers([walletTenDayOld.address])
          )
            .to.emit(showcase, "MemberRemoved")
            .withArgs(walletTenDayOld.address);
        });

        xit("can get member by index", async () => {});

        xit("can get all members", async () => {});
      });

      describe("with 1 member added today", () => {
        let firstWallet;
        beforeEach(async () => {
          let now = moment().utc().startOf("day");
          firstWallet = ethers.Wallet.createRandom().connect(provider);
          await showcase
            .connect(w0)
            .addMembers([firstWallet.address], [now.unix()]);
        });
        it("promotion has 1 memberCount based on existing members", async () => {
          const todaysPromo = [...samplePromotion];
          await showcase.connect(w1).addPromotion(todaysPromo);
          expect((await showcase.promotions(TODAYS_DATE)).memberCount).to.eq(1);
        });
        it("promotions memberCount changes as members move in and out", async () => {
          const tomorrowsPromo = [...samplePromotion];
          const now = moment().utc().startOf("day");
          const TOM_DATE = TOMORROWS_DATE;
          tomorrowsPromo[5] = TOMORROWS_DATE;
          await showcase.connect(w1).addPromotion(tomorrowsPromo);
          expect((await showcase.promotions(TOM_DATE)).memberCount).to.eq(1);
          let secondWallet = ethers.Wallet.createRandom().connect(provider);
          await showcase
            .connect(w0)
            .addMembers([secondWallet.address], [now.unix()]);
          expect((await showcase.promotions(TOM_DATE)).memberCount).to.eq(2);
          await showcase.connect(w0).removeMembers([secondWallet.address]);
          expect((await showcase.promotions(TOM_DATE)).memberCount).to.eq(1);
          await showcase.connect(w0).removeMembers([firstWallet.address]);
          expect((await showcase.promotions(TOM_DATE)).memberCount).to.eq(0);
        });
      });
    });

    describe("with many promotions", () => {
      let showcase;
      let w0;
      let w1;
      let promotions;

      beforeEach(async () => {
        const obj = await loadFixture(promotionsFixture);
        showcase = obj.showcase;
        w1 = obj.w1;
        w0 = obj.w0;

        promotions = [...Array(10)].map((elem, idx) => {
          const promotionDate = moment()
            .utc()
            .startOf("day")
            .subtract(idx, "days")
            .unix();
          return {
            promoter: w1.address,
            nftContractAddress: constants.AddressZero,
            nftTokenId: idx,
            clickThruUrl: "https://foo.com",
            amount: "1000",
            date: promotionDate,
            title: "Foo",
            subTitle: "Foobar",
            networkName: "mainnet",
            imageUrl: "",
            memberCount: 0,
          };
        });
        for (let i = 0; i < promotions.length; i += 1) {
          // console.log(promotions[i]);
          const result = await showcase.connect(w1).addPromotion(promotions[i]);
          await result.wait();
        }
      });

      it("has many promotions", async () => {
        let promotion = await showcase.promotions(TODAYS_DATE);
        expect(promotion.promoter).not.to.be.equal(constants.AddressZero);

        promotion = await showcase.promotions(YESTERDAYS_DATE);
        expect(promotion.promoter).not.to.be.equal(constants.AddressZero);

        promotion = await showcase.promotions(DAY_BEFORE_YESTERDAY_DATE);
        expect(promotion.promoter).not.to.be.equal(constants.AddressZero);
      });

      it("gives 0 address when no promotion", async () => {
        const promotion = await showcase.promotions(HUNDRED_DAYS_AGO_DATE);
        expect(promotion.promoter).to.be.equal(constants.AddressZero);
      });

      it("can give back 2 i.e. multiple promotions", async () => {
        const promos = await showcase.getMultiplePromotions([
          TODAYS_DATE,
          YESTERDAYS_DATE,
        ]);
        expect(promos.length).to.be.equal(2);
      });
      it("can give back 3, i.e. multiple promotions", async () => {
        const promos = await showcase.getMultiplePromotions([
          TODAYS_DATE,
          YESTERDAYS_DATE,
          DAY_BEFORE_YESTERDAY_DATE,
        ]);
        expect(promos.length).to.be.equal(3);
      });
      it("has promotion attributes in each promotion", async () => {
        const promos = await showcase.getMultiplePromotions([
          TODAYS_DATE,
          YESTERDAYS_DATE,
        ]);
        expect(promos[0].promoter).to.not.be.eq(constants.AddressZero);
        expect(promos[1].promoter).to.not.be.eq(constants.AddressZero);
      });
      it("has empty promotion attributes for missing promotion date", async () => {
        const promos = await showcase.getMultiplePromotions([
          TODAYS_DATE,
          HUNDRED_DAYS_AGO_DATE,
          YESTERDAYS_DATE,
        ]);
        expect(promos[0].promoter).to.not.be.eq(constants.AddressZero);
        expect(promos[1].promoter).to.be.eq(constants.AddressZero);
        expect(promos[2].promoter).to.not.be.eq(constants.AddressZero);
      });
    });

    describe("with one promotion", () => {
      let showcase;
      let promotion;
      let w0;
      let w1;

      beforeEach(async () => {
        const obj = await loadFixture(promotionsFixture);
        showcase = obj.showcase;
        w1 = obj.w1;
        w0 = obj.w0;

        promotion = [
          w1.address,
          constants.AddressZero,
          1001,
          "http://alphaback.xyz",
          1,
          TODAYS_DATE,
          "foo",
          "foo bar",
          "localhost",
          "",
          0,
        ];
        await showcase.connect(w1).addPromotion(promotion);
      });

      it("gives address when promotion is present", async () => {
        const promotionResult = await showcase.promotions(TODAYS_DATE);
        expect(promotionResult[0]).to.be.equal(promotion[0]);
      });

      it("gives 0 when promotion is not present", async () => {
        const promotionResult = await showcase.promotions(YESTERDAYS_DATE);
        expect(promotionResult[0]).to.not.be.equal(promotion[0]);
        expect(promotionResult[0]).to.be.equal(constants.AddressZero);
      });

      it("gives promotion date as string when promotion present", async () => {
        const promotionResult = await showcase.promotions(TODAYS_DATE);
        expect(promotionResult[5]).to.be.equal(promotion[5]);
      });

      it("gives promotion date as 0 when promotion not present", async () => {
        const promotionResult = await showcase.promotions(
          HUNDRED_DAYS_AGO_DATE
        );
        expect(promotionResult[5]).to.be.equal(0);
      });

      it("reverts when trying to add promotion on same date", async () => {
        const tempPromotion = [...promotion];
        tempPromotion[3] = "http://foobar.xyz";
        await expect(showcase.connect(w1).addPromotion(tempPromotion)).to.be
          .reverted;
      });

      it("does not reverts when trying to add promotion with diff date", async () => {
        const tempPromotion = [...promotion];
        tempPromotion[3] = "http://foobar.xyz";
        tempPromotion[5] = TOMORROWS_DATE;
        await expect(showcase.connect(w1).addPromotion(tempPromotion)).to.not.be
          .reverted;
      });
    });
  });
});
