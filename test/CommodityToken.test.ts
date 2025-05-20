import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CommodityToken", function () {
  let commodityToken: Contract;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let mockPriceFeed: string;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
  const QUALITY_VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("QUALITY_VERIFIER_ROLE"));
  const PRICE_UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRICE_UPDATER_ROLE"));

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();
    
    // Mock price feed address (would be Chainlink in production)
    mockPriceFeed = "0x1cCf8EB24eAe61a7Cf8bE2c3868D221C73C97f99";
    
    const CommodityToken = await ethers.getContractFactory("CommodityToken");
    
    commodityToken = await upgrades.deployProxy(
      CommodityToken,
      [
        "Coffee Robusta Token", 
        "CRT", 
        "Coffee-Robusta",
        mockPriceFeed,
        owner.address
      ],
      { kind: 'uups' }
    );
    
    await commodityToken.waitForDeployment();
    
    // Grant roles to minter
    await commodityToken.grantRole(MINTER_ROLE, minter.address);
    await commodityToken.grantRole(QUALITY_VERIFIER_ROLE, minter.address);
    await commodityToken.grantRole(PRICE_UPDATER_ROLE, minter.address);
    
    // Set compliance status for users
    await commodityToken.setComplianceStatus(user1.address, true);
    await commodityToken.setComplianceStatus(user2.address, true);
  });

  describe("Initialization", function () {
    it("Should initialize with correct name and symbol", async function () {
      expect(await commodityToken.name()).to.equal("Coffee Robusta Token");
      expect(await commodityToken.symbol()).to.equal("CRT");
    });

    it("Should set the correct commodity type", async function () {
      expect(await commodityToken.commodityType()).to.equal("Coffee-Robusta");
    });

    it("Should assign roles to the owner", async function () {
      expect(await commodityToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await commodityToken.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await commodityToken.hasRole(QUALITY_VERIFIER_ROLE, owner.address)).to.be.true;
      expect(await commodityToken.hasRole(PRICE_UPDATER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens to compliant address", async function () {
      const amount = ethers.parseUnits("100", 18);
      await commodityToken.connect(minter).restrictedMint(user1.address, amount);
      expect(await commodityToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should not allow minting to non-compliant address", async function () {
      const amount = ethers.parseUnits("100", 18);
      await commodityToken.setComplianceStatus(user1.address, false);
      await expect(
        commodityToken.connect(minter).restrictedMint(user1.address, amount)
      ).to.be.revertedWith("Recipient is not compliant");
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const amount = ethers.parseUnits("100", 18);
      await expect(
        commodityToken.connect(user1).restrictedMint(user2.address, amount)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      // Mint tokens to user1
      const amount = ethers.parseUnits("1000", 18);
      await commodityToken.connect(minter).restrictedMint(user1.address, amount);
    });

    it("Should allow compliant transfer between compliant addresses", async function () {
      const amount = ethers.parseUnits("100", 18);
      await commodityToken.connect(user1).transfer(user2.address, amount);
      expect(await commodityToken.balanceOf(user2.address)).to.equal(amount);
    });

    it("Should not allow transfer to non-compliant address", async function () {
      const amount = ethers.parseUnits("100", 18);
      await commodityToken.setComplianceStatus(user2.address, false);
      await expect(
        commodityToken.connect(user1).transfer(user2.address, amount)
      ).to.be.revertedWith("Recipient is not compliant");
    });

    it("Should not allow transfer from non-compliant address", async function () {
      const amount = ethers.parseUnits("100", 18);
      await commodityToken.setComplianceStatus(user1.address, false);
      await expect(
        commodityToken.connect(user1).transfer(user2.address, amount)
      ).to.be.revertedWith("Sender is not compliant");
    });
  });

  describe("Quality and Price Updates", function () {
    it("Should allow quality verifier to update quality score", async function () {
      await commodityToken.connect(minter).validateQuality(85);
      expect(await commodityToken.qualityScore()).to.equal(85);
    });

    it("Should not allow non-verifier to update quality score", async function () {
      await expect(
        commodityToken.connect(user1).validateQuality(85)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });

    it("Should allow price updater to update price", async function () {
      const newPrice = ethers.parseUnits("5000", 8); // $50.00 with 8 decimals
      await commodityToken.connect(minter).updatePrice(newPrice);
      expect(await commodityToken.pricePerUnit()).to.equal(newPrice);
    });

    it("Should not allow non-updater to update price", async function () {
      const newPrice = ethers.parseUnits("5000", 8);
      await expect(
        commodityToken.connect(user1).updatePrice(newPrice)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
  });

  describe("Emergency Controls", function () {
    beforeEach(async function () {
      // Mint tokens to user1
      const amount = ethers.parseUnits("1000", 18);
      await commodityToken.connect(minter).restrictedMint(user1.address, amount);
    });

    it("Should allow pauser to pause the contract", async function () {
      await commodityToken.connect(owner).emergencyPause();
      expect(await commodityToken.paused()).to.be.true;
    });

    it("Should prevent transfers when paused", async function () {
      await commodityToken.connect(owner).emergencyPause();
      const amount = ethers.parseUnits("100", 18);
      await expect(
        commodityToken.connect(user1).transfer(user2.address, amount)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow pauser to unpause the contract", async function () {
      await commodityToken.connect(owner).emergencyPause();
      await commodityToken.connect(owner).emergencyUnpause();
      expect(await commodityToken.paused()).to.be.false;
    });

    it("Should allow transfers after unpausing", async function () {
      await commodityToken.connect(owner).emergencyPause();
      await commodityToken.connect(owner).emergencyUnpause();
      
      const amount = ethers.parseUnits("100", 18);
      await commodityToken.connect(user1).transfer(user2.address, amount);
      expect(await commodityToken.balanceOf(user2.address)).to.equal(amount);
    });
  });
});
