// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title CommodityToken
 * @dev ERC20 token representing agricultural commodities with regulatory compliance features
 */
contract CommodityToken is 
    Initializable, 
    ERC20Upgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant QUALITY_VERIFIER_ROLE = keccak256("QUALITY_VERIFIER_ROLE");
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");
    
    // Commodity details
    string public commodityType; // e.g., "Coffee-Robusta", "Coffee-Arabica", etc.
    uint256 public qualityScore; // 0-100 score representing quality
    uint256 public pricePerUnit; // Price in USD cents
    
    // Chainlink price feed
    AggregatorV3Interface internal priceFeed;
    
    // Regulatory compliance
    mapping(address => bool) public compliantAddresses;
    
    // Events
    event QualityUpdated(uint256 newQualityScore, address verifier);
    event PriceUpdated(uint256 newPrice, address updater);
    event ComplianceStatusChanged(address account, bool isCompliant);
    event EmergencyPause(address admin);
    event EmergencyUnpause(address admin);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract with commodity details and roles
     */
    function initialize(
        string memory name,
        string memory symbol,
        string memory _commodityType,
        address _priceFeedAddress,
        address admin
    ) initializer public {
        __ERC20_init(name, symbol);
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(QUALITY_VERIFIER_ROLE, admin);
        _grantRole(PRICE_UPDATER_ROLE, admin);
        
        commodityType = _commodityType;
        qualityScore = 0;
        pricePerUnit = 0;
        
        // Initialize Chainlink price feed
        if (_priceFeedAddress != address(0)) {
            priceFeed = AggregatorV3Interface(_priceFeedAddress);
        }
        
        // Set admin as compliant by default
        compliantAddresses[admin] = true;
    }

    /**
     * @dev Restricted mint function with role-based access control
     */
    function restrictedMint(address to, uint256 amount) public onlyRole(MINTER_ROLE) whenNotPaused {
        require(compliantAddresses[to], "Recipient is not compliant");
        _mint(to, amount);
    }

    /**
     * @dev Burn function with verification checks
     */
    function burn(uint256 amount) public whenNotPaused {
        require(compliantAddresses[_msgSender()], "Sender is not compliant");
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Transfer with regulatory compliance checks
     */
    function compliantTransfer(address to, uint256 amount) public whenNotPaused returns (bool) {
        require(compliantAddresses[_msgSender()], "Sender is not compliant");
        require(compliantAddresses[to], "Recipient is not compliant");
        _transfer(_msgSender(), to, amount);
        return true;
    }

    /**
     * @dev Override the standard transfer to enforce compliance
     */
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return compliantTransfer(to, amount);
    }

    /**
     * @dev Override the standard transferFrom to enforce compliance
     */
    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        require(compliantAddresses[from], "Sender is not compliant");
        require(compliantAddresses[to], "Recipient is not compliant");
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Update quality score using oracle data
     */
    function validateQuality(uint256 newQualityScore) public onlyRole(QUALITY_VERIFIER_ROLE) whenNotPaused {
        require(newQualityScore <= 100, "Quality score must be between 0-100");
        qualityScore = newQualityScore;
        emit QualityUpdated(newQualityScore, _msgSender());
    }

    /**
     * @dev Update price with Chainlink integration
     */
    function updatePrice(uint256 newPrice) public onlyRole(PRICE_UPDATER_ROLE) whenNotPaused {
        pricePerUnit = newPrice;
        emit PriceUpdated(newPrice, _msgSender());
    }

    /**
     * @dev Update price using Chainlink oracle
     */
    function updatePriceFromOracle() public onlyRole(PRICE_UPDATER_ROLE) whenNotPaused {
        require(address(priceFeed) != address(0), "Price feed not set");
        
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from oracle");
        
        pricePerUnit = uint256(price);
        emit PriceUpdated(pricePerUnit, _msgSender());
    }

    /**
     * @dev Set compliance status for an address
     */
    function setComplianceStatus(address account, bool isCompliant) public onlyRole(DEFAULT_ADMIN_ROLE) {
        compliantAddresses[account] = isCompliant;
        emit ComplianceStatusChanged(account, isCompliant);
    }

    /**
     * @dev Emergency pause function
     */
    function emergencyPause() public onlyRole(PAUSER_ROLE) {
        _pause();
        emit EmergencyPause(_msgSender());
    }

    /**
     * @dev Emergency unpause function
     */
    function emergencyUnpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
        emit EmergencyUnpause(_msgSender());
    }

    /**
     * @dev Set Chainlink price feed address
     */
    function setPriceFeed(address _priceFeedAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_priceFeedAddress != address(0), "Invalid price feed address");
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    /**
     * @dev Required by the UUPS module
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
