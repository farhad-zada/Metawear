// Metawear.test.js
const { zeroAddress } = require("@nomicfoundation/ethereumjs-util");
const { expect } = require("chai");
const { ethers, waffle, upgrades } = require("hardhat");
const { parseUnits, parseEther } = ethers;

describe("Metawear", function () {
  let wear;
  let owner, admin, user;

  beforeEach(async function () {
    [owner, admin, user] = await ethers.getSigners();

    // Deploy the contract
    const Metawear = await ethers.getContractFactory("Metawear");
    wear = await upgrades.deployProxy(Metawear, [], {
      initializer: "initialize",
      kind: "transparent",
    });

    // Add admin
    await wear.setAdmin(admin.address, true);
  });

  it("Should initialize the contract with correct initial balances", async function () {
    const balance = await wear.balanceOf(owner);
    expect(balance).to.equal(parseUnits("1000000000", 18));
  });

  it("Should allow only admin to mint tokens", async function () {
    // Try to mint from a non-admin account
    await expect(
      wear.connect(user).mint(user.address, parseUnits("100", 18))
    ).to.be.revertedWith("Metawear: not admin");

    // Mint tokens from an admin account
    await wear.connect(admin).mint(user.address, parseUnits("100", 18));

    // Check the user's balance
    const userBalance = await wear.balanceOf(user.address);
    expect(userBalance).to.equal(parseUnits("100", 18));
  });

  it("Should allow only owner to add and remove admins", async function () {
    // Try to add an admin from a non-owner account
    await expect(
      wear.connect(user).setAdmin(user.address, true)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    // Add an admin from the owner account
    await wear.connect(owner).setAdmin(user.address, true);
    expect(await wear.admins(user.address)).to.be.true;

    // Remove an admin from the owner account
    await wear.connect(owner).setAdmin(user.address, false);
    expect(await wear.admins(user.address)).to.be.false;
  });

  it("Should allow burning tokens", async function () {
    // owner balance
    const ownerBalanceInitial = await wear.balanceOf(owner.address);
    expect(ownerBalanceInitial).to.equal(parseUnits("1000000000", 18));

    // burn tokens
    await wear.connect(owner).burn(parseUnits("1000000000", 18));

    // owner balance
    const ownerBalanceFinal = await wear.balanceOf(owner.address);
    expect(ownerBalanceFinal).to.equal(parseUnits("0", 18));
  });

  it("Should allow only owner to withdraw tokens", async function () {
    // Deploy a mock ERC20 token
    const erc20Mock = await ethers.deployContract("ERC20Mock");

    // Mint some tokens to the ERC20Mock contract
    await erc20Mock.mint(wear.target, parseUnits("100", 18));

    // Try to withdraw tokens from a non-owner account
    await expect(
      wear
        .connect(user)
        .withdraw(erc20Mock.target, user.address, parseUnits("50", 18))
    ).to.be.revertedWith("Ownable: caller is not the owner");

    // Withdraw tokens from the owner account
    await wear
      .connect(owner)
      .withdraw(erc20Mock.target, user.address, parseUnits("50", 18));

    // Check the user's balance in the ERC20Mock contract
    const userBalance = await erc20Mock.balanceOf(user.address);
    expect(userBalance).to.equal(parseUnits("50", 18));
  });

  it("Should emit Admin event when adding or removing admin", async function () {
    // Add admin and check the emitted event
    await expect(wear.connect(owner).setAdmin(user.address, true))
      .to.emit(wear, "Admin")
      .withArgs(user.address, true);

    // Remove admin and check the emitted event
    await expect(wear.connect(owner).setAdmin(user.address, false))
      .to.emit(wear, "Admin")
      .withArgs(user.address, false);
  });

  it("Should emit Transfer event when minting tokens", async function () {
    // Mint tokens and check the emitted event
    await expect(wear.connect(admin).mint(user.address, parseUnits("100", 18)))
      .to.emit(wear, "Transfer")
      .withArgs(zeroAddress(), user.address, parseUnits("100", 18));
  });

  it("Should emit Transfer event when burning tokens", async function () {
    // Burn tokens and check the emitted event
    await expect(wear.connect(owner).burn(parseUnits("100", 18)))
      .to.emit(wear, "Transfer")
      .withArgs(owner.address, zeroAddress(), parseUnits("100", 18));
  });

  it("Should deduct the correct fee on transfer", async function () {
    // Set the transfer fee to 10%
    await wear.setTransferFeePercent(parseUnits("10", 16));

    // Mint some tokens to a non-whitelisted address
    await wear.mint(user, parseEther("10"));

    // Owner initial balance
    const ownerBalanceInitial = await wear.balanceOf(owner);
    // Transfer tokens from the non-whitelisted address

    await wear.connect(user).transfer(owner.address, parseEther("1"));

    // Check the balances
    const userBalance = await wear.balanceOf(user);
    const ownerFinalBalance = await wear.balanceOf(owner);
    // The non-whitelisted address should have 9 ETH (10 ETH - 10% fee)
    expect(userBalance).to.equal(parseEther("9"));

    // The contract should have 1000_000_000.1 ETH (1 ETH transfer + 10% fee)
    expect(ownerFinalBalance - ownerBalanceInitial).to.equal(parseEther("0.9"));
  });

  it("Should allow only whitelisted addresses to transfer tokens without fee", async function () {
    // Set the transfer fee to 10%
    await wear.setTransferFeePercent(10);

    // Set the whitelisted address to true
    await wear.setWhitelistBatch([user], [true]);

    // Mint some tokens to a whitelisted address
    await wear.mint(user, parseEther("10"));

    // Owner initial balance
    const ownerBalanceInitial = await wear.balanceOf(owner);
    // Transfer tokens from the whitelisted address
    await wear.connect(user).transfer(owner, parseEther("1"));

    // Check the balances
    const userBalance = await wear.balanceOf(user);
    const ownerFinalBalance = await wear.balanceOf(owner);

    // The whitelisted address should have 9 ETH (10 ETH - 10% fee)
    expect(userBalance).to.equal(parseEther("9"));

    // The contract should have 1000_000_000 ETH (1 ETH transfer + 0% fee)
    expect(ownerFinalBalance - ownerBalanceInitial).to.equal(parseEther("1"));

    // Set the whitelisted address to false
    await wear.setWhitelistBatch([user], [false]);
  });

  it("Should allow only owner to set transfer fee percent", async function () {
    // Try to set the transfer fee percent from a non-owner account
    await expect(
      wear.connect(user).setTransferFeePercent(10)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    // Set the transfer fee percent from the owner account
    await wear.connect(owner).setTransferFeePercent(10);
    expect(await wear.transferFeePercent()).to.equal(10);
  });

  it("Should allow only owner to set whitelist batch", async function () {
    // Try to set the whitelist batch from a non-owner account
    await expect(
      wear.connect(user).setWhitelistBatch([user.address], [true])
    ).to.be.revertedWith("Metawear: not admin");

    // Set the whitelist batch from the owner account
    await wear.connect(owner).setWhitelistBatch([user.address], [true]);
    expect(await wear.whitelist(user.address)).to.be.true;
  });

  it("Should emit Transfer event when transferring tokens", async function () {
    // Mint some tokens to a non-whitelisted address
    await wear.mint(user, parseEther("10"));

    // Check the emitted event
    await expect(wear.connect(user).transfer(owner, parseEther("1")))
      .to.emit(wear, "Transfer")
      .withArgs(user.address, owner.address, parseEther("1"));
  });

  it("Should remain remnant tokens in owner account after transferring", async function () {
    // Burn tokens
    await wear.connect(owner).transfer(user, parseUnits("1000000000", 18));

    // Check the owner's balance
    const ownerBalance = await wear.balanceOf(owner.address);
    expect(ownerBalance).to.equal(parseUnits("1", 18));
  });

  it("Should be upgraded successfully", async function () {
    const MetawearBurnable = await ethers.getContractFactory(
      "MetawearBurnable"
    );
    const Metawear = await ethers.getContractFactory("Metawear");

    const wearV1 = await upgrades.deployProxy(MetawearBurnable, [], {
      initializer: "initialize",
      kind: "transparent",
    });

    const wearV2 = await upgrades.upgradeProxy(wearV1.target, Metawear);

    // Check the owner's balance
    const ownerBalanceV0 = await wearV1.balanceOf(owner.address);
    const ownerBalanceV2 = await wearV2.balanceOf(owner.address);
    expect(ownerBalanceV0).to.equal(ownerBalanceV2);
  });

  describe("Upgrades", function () {
    let wearV1;
    let wearV2;
    this.beforeAll(async function () {
      const MetawearBurnable = await ethers.getContractFactory(
        "MetawearBurnable"
      );
      const Metawear = await ethers.getContractFactory("Metawear");

      wearV1 = await upgrades.deployProxy(MetawearBurnable, [], {
        initializer: "initialize",
        kind: "transparent",
      });

      wearV2 = await upgrades.upgradeProxy(wearV1.target, Metawear);
    });

    it("Should upgrade successfully", async function () {
      const MetawearBurnable = await ethers.getContractFactory(
        "MetawearBurnable"
      );
      const Metawear = await ethers.getContractFactory("Metawear");

      const wearV1 = await upgrades.deployProxy(MetawearBurnable, [], {
        initializer: "initialize",
        kind: "transparent",
      });

      const wearV2 = await upgrades.upgradeProxy(wearV1.target, Metawear);

      // Check the owner's balance
      const ownerBalanceV0 = await wearV1.balanceOf(owner.address);
      const ownerBalanceV2 = await wearV2.balanceOf(owner.address);
      expect(ownerBalanceV0).to.equal(ownerBalanceV2);
    });

    it("Should set transferFeePercent to 100 * 10**18", async function () {
      await wearV2.setTransferFeePercent(parseUnits("100", 16));
      expect(await wearV2.transferFeePercent()).to.equal(parseUnits("100", 16));
    });

    it("Should revert with Metawear: not admin", async function () {
      await expect(
        wearV2.connect(user).setTransferFeePercent(parseUnits("100", 16))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should set whitelist to true", async function () {
      await wearV2.setAdmin(owner.address, true);
      await wearV2.setWhitelistBatch([user.address], [true]);
      expect(await wearV2.whitelist(user.address)).to.be.true;
    });

    it("Fee percent floor should be 0", async function () {
      expect(await wearV2.percentFloor()).to.equal(0);
    });

    it("Should set percent floor to 10**18", async function () {
      await wearV2.setPercentFloor(parseUnits("1", 18));
      expect(await wearV2.percentFloor()).to.equal(parseUnits("1", 18));
    });
  });
});
