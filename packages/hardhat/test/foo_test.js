/* eslint-disable no-unused-expressions */

const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const {
  getContractFactory,
  constants: { AddressZero },
} = ethers;
const { deployProxy, upgradeProxy, erc1967 } = upgrades;

describe.only("Foo", () => {
  describe("v1", () => {
    let foo1;
    before(async () => {
      const Foo1 = await getContractFactory("FooV1");
      foo1 = await deployProxy(Foo1, [100], { kind: "uups" });
    });
    it("can be deployed with proxy & implementation", async () => {
      const proxyAddress = foo1.address;
      expect(proxyAddress).to.be.properAddress;
      expect(proxyAddress).to.not.be.eq(AddressZero);
      const implAddress = await erc1967.getImplementationAddress(proxyAddress);
      expect(implAddress).to.be.properAddress;
      expect(implAddress).to.not.be.eq(AddressZero);
    });
    it("has count value", async () => {
      expect(await foo1.count()).to.be.eq(100);
    });
    it("has owner", async () => {
      const [deployer] = await ethers.getSigners();
      expect(await foo1.owner()).to.be.eq(deployer.address);
    });
  });
  describe("v2", () => {
    let foo1;
    let foo2;
    before(async () => {
      const Foo1 = await getContractFactory("FooV1");
      foo1 = await deployProxy(Foo1, [100], { kind: "uups" });
      const Foo2 = await getContractFactory("FooV2");
      foo2 = await upgradeProxy(foo1, Foo2, {
        call: {
          fn: "initialize",
          args: [200],
        },
        unsafeSkipStorageCheck: true,
      });
    });
    it("can be upgraded with same proxy address & imp address", async () => {
      const proxyAddress = foo2.address;
      expect(proxyAddress).to.be.properAddress;
      expect(proxyAddress).to.not.be.eq(AddressZero);
      expect(proxyAddress).to.be.eq(foo1.address);

      const implAddress = await erc1967.getImplementationAddress(proxyAddress);
      expect(implAddress).to.be.properAddress;
      expect(implAddress).to.not.be.eq(AddressZero);
    });

    it("count has original value", async () => {
      expect(await foo2.count()).to.be.eq(100);
    });
    it("owner has original value", async () => {
      const [deployer] = await ethers.getSigners();
      expect(await foo2.owner()).to.be.eq(deployer.address);
    });
    it("average has new value", async () => {
      expect(await foo2.average()).to.be.eq(200);
    });
  });
  describe("v3", () => {
    let foo1;
    let foo2;
    let foo3;
    before(async () => {
      const Foo1 = await getContractFactory("FooV1");
      foo1 = await deployProxy(Foo1, [100], { kind: "uups" });
      const Foo2 = await getContractFactory("FooV2");
      foo2 = await upgradeProxy(foo1, Foo2, {
        call: {
          fn: "initialize",
          args: [200],
        },
        unsafeSkipStorageCheck: true,
      });
      const Foo3 = await getContractFactory("FooV3");
      foo3 = await upgradeProxy(foo2.address, Foo3, {
        call: {
          fn: "initialize",
          args: [],
        },
      });
    });
    it("can be upgraded with same proxy address & imp address", async () => {
      const proxyAddress = foo2.address;
      expect(proxyAddress).to.be.properAddress;
      expect(proxyAddress).to.not.be.eq(AddressZero);
      expect(proxyAddress).to.be.eq(foo1.address);

      const implAddress = await erc1967.getImplementationAddress(proxyAddress);
      expect(implAddress).to.be.properAddress;
      expect(implAddress).to.not.be.eq(AddressZero);
    });
    it("has incrementCount which changes count by 1", async () => {
      expect(foo3.incrementCount).to.not.be.eq(undefined);
      const oldCount = await foo3.count();
      await foo3.incrementCount();
      const newCount = await foo3.count();
      expect(newCount.sub(oldCount)).to.be.eq(1);
    });
  });
});
