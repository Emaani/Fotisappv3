import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("Deploying Agricultural Commodities Trading Platform contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy CommodityToken implementation for Coffee-Robusta
  const CommodityToken = await ethers.getContractFactory("CommodityToken");
  
  // Chainlink price feed addresses (replace with actual addresses for production)
  const priceFeedAddresses = {
    "Coffee-Robusta": "0x1cCf8EB24eAe61a7Cf8bE2c3868D221C73C97f99", // Example Chainlink price feed
    "Coffee-Arabica": "0x2cCf8EB24eAe61a7Cf8bE2c3868D221C73C97f99", // Example Chainlink price feed
    "Cocoa": "0x3cCf8EB24eAe61a7Cf8bE2c3868D221C73C97f99", // Example Chainlink price feed
    "Sesame": "0x4cCf8EB24eAe61a7Cf8bE2c3868D221C73C97f99", // Example Chainlink price feed
    "Sunflower": "0x5cCf8EB24eAe61a7Cf8bE2c3868D221C73C97f99", // Example Chainlink price feed
  };

  // Deploy commodity tokens
  const commodityTokens: Record<string, Contract> = {};
  
  for (const [commodity, priceFeed] of Object.entries(priceFeedAddresses)) {
    console.log(`Deploying ${commodity} token...`);
    
    const symbol = commodity.split('-')[0].substring(0, 3).toUpperCase();
    
    const token = await upgrades.deployProxy(
      CommodityToken,
      [
        `${commodity} Token`, 
        symbol, 
        commodity,
        priceFeed,
        deployer.address
      ],
      { kind: 'uups' }
    );
    
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    
    console.log(`${commodity} token deployed to:`, tokenAddress);
    commodityTokens[commodity] = token;
  }

  // Deploy TradingEngine
  console.log("Deploying Trading Engine...");
  const TradingEngine = await ethers.getContractFactory("TradingEngine");
  
  const tradingEngine = await upgrades.deployProxy(
    TradingEngine,
    [deployer.address],
    { kind: 'uups' }
  );
  
  await tradingEngine.waitForDeployment();
  const tradingEngineAddress = await tradingEngine.getAddress();
  
  console.log("Trading Engine deployed to:", tradingEngineAddress);

  // Add trading pairs to the trading engine
  console.log("Adding trading pairs to Trading Engine...");
  
  for (const [commodity, token] of Object.entries(commodityTokens)) {
    const tokenAddress = await token.getAddress();
    const priceFeed = priceFeedAddresses[commodity];
    
    // Add trading pair with parameters:
    // - Token address
    // - Price feed address
    // - Min order size (1 token)
    // - Max order size (1000 tokens)
    // - Price decimals (8 for Chainlink)
    await tradingEngine.addTradingPair(
      tokenAddress,
      priceFeed,
      ethers.parseUnits("1", 18),
      ethers.parseUnits("1000", 18),
      8
    );
    
    console.log(`Added ${commodity} trading pair`);
    
    // Grant MINTER_ROLE to trading engine
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, tradingEngineAddress);
    console.log(`Granted MINTER_ROLE to Trading Engine for ${commodity}`);
  }

  console.log("Deployment completed successfully!");
  
  // Return deployed contract addresses for verification
  return {
    tradingEngine: tradingEngineAddress,
    commodityTokens: Object.fromEntries(
      await Promise.all(
        Object.entries(commodityTokens).map(
          async ([name, token]) => [name, await token.getAddress()]
        )
      )
    )
  };
}

main()
  .then((deployedContracts) => {
    console.log("Deployed contracts:", deployedContracts);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
