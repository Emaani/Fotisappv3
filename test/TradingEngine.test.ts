import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TradingEngine", function () {
  let tradingEngine: Contract;
  let commodityToken: Contract;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let trader1: SignerWithAddress;
  let trader2: SignerWithAddress;
  let mockPriceFeed: string;

  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
  const CIRCUIT_BREAKER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CIRCUIT_BREAKER_ROLE"));
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

  beforeEach(async function () {
    [owner, operator, trader1, trader2] = await ethers.getSigners();
    
    // Mock price feed address (would be Chainlink in production)
    mockPriceFeed = "0x1cCf8EB24eAe61a7Cf8bE2c3868D221C73C97f99";
    
    // Deploy CommodityToken
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
    
    // Deploy TradingEngine
    const TradingEngine = await ethers.getContractFactory("TradingEngine");
    
    tradingEngine = await upgrades.deployProxy(
      TradingEngine,
      [owner.address],
      { kind: 'uups' }
    );
    
    await tradingEngine.waitForDeployment();
    
    // Grant roles
    await tradingEngine.grantRole(OPERATOR_ROLE, operator.address);
    await tradingEngine.grantRole(CIRCUIT_BREAKER_ROLE, operator.address);
    
    // Set up trading pair
    const tokenAddress = await commodityToken.getAddress();
    await tradingEngine.addTradingPair(
      tokenAddress,
      mockPriceFeed,
      ethers.parseUnits("1", 18), // Min order size
      ethers.parseUnits("1000", 18), // Max order size
      8 // Price decimals
    );
    
    // Grant MINTER_ROLE to trading engine
    await commodityToken.grantRole(MINTER_ROLE, await tradingEngine.getAddress());
    
    // Set compliance status for traders
    await commodityToken.setComplianceStatus(trader1.address, true);
    await commodityToken.setComplianceStatus(trader2.address, true);
    await commodityToken.setComplianceStatus(await tradingEngine.getAddress(), true);
    
    // Mint tokens to traders
    await commodityToken.restrictedMint(trader1.address, ethers.parseUnits("1000", 18));
    await commodityToken.restrictedMint(trader2.address, ethers.parseUnits("1000", 18));
  });

  describe("Trading Pair Management", function () {
    it("Should add a trading pair correctly", async function () {
      const tokenAddress = await commodityToken.getAddress();
      const pair = await tradingEngine.tradingPairs(tokenAddress);
      
      expect(pair.tokenAddress).to.equal(tokenAddress);
      expect(pair.priceFeedAddress).to.equal(mockPriceFeed);
      expect(pair.isActive).to.be.true;
      expect(pair.minOrderSize).to.equal(ethers.parseUnits("1", 18));
      expect(pair.maxOrderSize).to.equal(ethers.parseUnits("1000", 18));
    });

    it("Should update trading pair status", async function () {
      const tokenAddress = await commodityToken.getAddress();
      await tradingEngine.updateTradingPairStatus(tokenAddress, false);
      
      const pair = await tradingEngine.tradingPairs(tokenAddress);
      expect(pair.isActive).to.be.false;
    });

    it("Should not allow non-admin to add trading pair", async function () {
      const tokenAddress = await commodityToken.getAddress();
      await expect(
        tradingEngine.connect(trader1).addTradingPair(
          tokenAddress,
          mockPriceFeed,
          ethers.parseUnits("1", 18),
          ethers.parseUnits("1000", 18),
          8
        )
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
  });

  describe("Order Creation", function () {
    it("Should create a buy order", async function () {
      const tokenAddress = await commodityToken.getAddress();
      const amount = ethers.parseUnits("10", 18);
      const price = ethers.parseUnits("5000", 8); // $50.00
      
      await tradingEngine.connect(trader1).createBuyOrder(tokenAddress, amount, price);
      
      const orderId = 1; // First order ID
      const order = await tradingEngine.orders(orderId);
      
      expect(order.trader).to.equal(trader1.address);
      expect(order.tokenAddress).to.equal(tokenAddress);
      expect(order.orderType).to.equal(0); // BUY
      expect(order.amount).to.equal(amount);
      expect(order.price).to.equal(price);
      expect(order.status).to.equal(0); // OPEN
    });

    it("Should create a sell order and transfer tokens", async function () {
      const tokenAddress = await commodityToken.getAddress();
      const amount = ethers.parseUnits("10", 18);
      const price = ethers.parseUnits("5000", 8); // $50.00
      
      // Approve trading engine to transfer tokens
      await commodityToken.connect(trader1).approve(await tradingEngine.getAddress(), amount);
      
      const initialBalance = await commodityToken.balanceOf(trader1.address);
      
      await tradingEngine.connect(trader1).createSellOrder(tokenAddress, amount, price);
      
      const orderId = 1; // First order ID
      const order = await tradingEngine.orders(orderId);
      
      expect(order.trader).to.equal(trader1.address);
      expect(order.tokenAddress).to.equal(tokenAddress);
      expect(order.orderType).to.equal(1); // SELL
      expect(order.amount).to.equal(amount);
      expect(order.price).to.equal(price);
      expect(order.status).to.equal(0); // OPEN
      
      // Check that tokens were transferred from trader to trading engine
      const finalBalance = await commodityToken.balanceOf(trader1.address);
      expect(finalBalance).to.equal(initialBalance - amount);
    });

    it("Should not create order for inactive trading pair", async function () {
      const tokenAddress = await commodityToken.getAddress();
      await tradingEngine.updateTradingPairStatus(tokenAddress, false);
      
      const amount = ethers.parseUnits("10", 18);
      const price = ethers.parseUnits("5000", 8);
      
      await expect(
        tradingEngine.connect(trader1).createBuyOrder(tokenAddress, amount, price)
      ).to.be.revertedWith("Trading pair is not active");
    });

    it("Should not create order with amount below minimum", async function () {
      const tokenAddress = await commodityToken.getAddress();
      const amount = ethers.parseUnits("0.5", 18); // Below minimum of 1
      const price = ethers.parseUnits("5000", 8);
      
      await expect(
        tradingEngine.connect(trader1).createBuyOrder(tokenAddress, amount, price)
      ).to.be.revertedWith("Order size too small");
    });

    it("Should not create order with amount above maximum", async function () {
      const tokenAddress = await commodityToken.getAddress();
      const amount = ethers.parseUnits("1001", 18); // Above maximum of 1000
      const price = ethers.parseUnits("5000", 8);
      
      await expect(
        tradingEngine.connect(trader1).createBuyOrder(tokenAddress, amount, price)
      ).to.be.revertedWith("Order size too large");
    });
  });

  describe("Order Cancellation", function () {
    beforeEach(async function () {
      const tokenAddress = await commodityToken.getAddress();
      const amount = ethers.parseUnits("10", 18);
      const price = ethers.parseUnits("5000", 8);
      
      // Create a sell order
      await commodityToken.connect(trader1).approve(await tradingEngine.getAddress(), amount);
      await tradingEngine.connect(trader1).createSellOrder(tokenAddress, amount, price);
    });

    it("Should allow trader to cancel their own order", async function () {
      const orderId = 1;
      await tradingEngine.connect(trader1).cancelOrder(orderId);
      
      const order = await tradingEngine.orders(orderId);
      expect(order.status).to.equal(2); // CANCELLED
    });

    it("Should allow operator to cancel any order", async function () {
      const orderId = 1;
      await tradingEngine.connect(operator).cancelOrder(orderId);
      
      const order = await tradingEngine.orders(orderId);
      expect(order.status).to.equal(2); // CANCELLED
    });

    it("Should not allow other traders to cancel someone else's order", async function () {
      const orderId = 1;
      await expect(
        tradingEngine.connect(trader2).cancelOrder(orderId)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should return tokens to seller when cancelling sell order", async function () {
      const orderId = 1;
      const initialBalance = await commodityToken.balanceOf(trader1.address);
      
      await tradingEngine.connect(trader1).cancelOrder(orderId);
      
      const finalBalance = await commodityToken.balanceOf(trader1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Circuit Breaker", function () {
    it("Should allow circuit breaker role to trigger circuit breaker", async function () {
      await tradingEngine.connect(operator).triggerCircuitBreaker();
      
      const circuitBreaker = await tradingEngine.circuitBreaker();
      expect(circuitBreaker.isTriggered).to.be.true;
    });

    it("Should not allow creating orders when circuit breaker is triggered", async function () {
      await tradingEngine.connect(operator).triggerCircuitBreaker();
      
      const tokenAddress = await commodityToken.getAddress();
      const amount = ethers.parseUnits("10", 18);
      const price = ethers.parseUnits("5000", 8);
      
      await expect(
        tradingEngine.connect(trader1).createBuyOrder(tokenAddress, amount, price)
      ).to.be.revertedWith("Circuit breaker is active");
    });

    it("Should not allow resetting circuit breaker before cooldown period", async function () {
      await tradingEngine.connect(operator).triggerCircuitBreaker();
      
      await expect(
        tradingEngine.connect(operator).resetCircuitBreaker()
      ).to.be.revertedWith("Cooldown period not elapsed");
    });
  });

  describe("Order Matching", function () {
    it("Should match buy and sell orders with compatible prices", async function () {
      const tokenAddress = await commodityToken.getAddress();
      const amount = ethers.parseUnits("10", 18);
      const sellPrice = ethers.parseUnits("5000", 8);
      const buyPrice = ethers.parseUnits("5100", 8); // Higher than sell price
      
      // Create a sell order
      await commodityToken.connect(trader1).approve(await tradingEngine.getAddress(), amount);
      await tradingEngine.connect(trader1).createSellOrder(tokenAddress, amount, sellPrice);
      
      // Create a buy order that should match
      await tradingEngine.connect(trader2).createBuyOrder(tokenAddress, amount, buyPrice);
      
      // Check orders are filled
      const sellOrder = await tradingEngine.orders(1);
      const buyOrder = await tradingEngine.orders(2);
      
      expect(sellOrder.status).to.equal(1); // FILLED
      expect(buyOrder.status).to.equal(1); // FILLED
      expect(sellOrder.filledAmount).to.equal(amount);
      expect(buyOrder.filledAmount).to.equal(amount);
      
      // Check tokens were transferred to buyer
      const buyerBalance = await commodityToken.balanceOf(trader2.address);
      expect(buyerBalance).to.equal(ethers.parseUnits("1010", 18)); // Initial 1000 + 10 bought
    });

    it("Should partially fill orders with different amounts", async function () {
      const tokenAddress = await commodityToken.getAddress();
      const sellAmount = ethers.parseUnits("20", 18);
      const buyAmount = ethers.parseUnits("10", 18);
      const price = ethers.parseUnits("5000", 8);
      
      // Create a sell order
      await commodityToken.connect(trader1).approve(await tradingEngine.getAddress(), sellAmount);
      await tradingEngine.connect(trader1).createSellOrder(tokenAddress, sellAmount, price);
      
      // Create a buy order with smaller amount
      await tradingEngine.connect(trader2).createBuyOrder(tokenAddress, buyAmount, price);
      
      // Check orders status
      const sellOrder = await tradingEngine.orders(1);
      const buyOrder = await tradingEngine.orders(2);
      
      expect(sellOrder.status).to.equal(0); // OPEN (partially filled)
      expect(buyOrder.status).to.equal(1); // FILLED
      expect(sellOrder.filledAmount).to.equal(buyAmount);
      expect(buyOrder.filledAmount).to.equal(buyAmount);
    });
  });
});
