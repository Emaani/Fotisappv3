// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./CommodityToken.sol";

/**
 * @title TradingEngine
 * @dev Handles order matching and settlement for agricultural commodities
 */
contract TradingEngine is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant CIRCUIT_BREAKER_ROLE = keccak256("CIRCUIT_BREAKER_ROLE");
    
    // Order types
    enum OrderType { BUY, SELL }
    
    // Order status
    enum OrderStatus { OPEN, FILLED, CANCELLED, EXPIRED }
    
    // Order structure
    struct Order {
        uint256 id;
        address trader;
        address tokenAddress;
        OrderType orderType;
        uint256 amount;
        uint256 price;
        uint256 timestamp;
        OrderStatus status;
        uint256 filledAmount;
    }
    
    // Trading pairs
    struct TradingPair {
        address tokenAddress;
        address priceFeedAddress;
        bool isActive;
        uint256 minOrderSize;
        uint256 maxOrderSize;
        uint256 priceDecimals;
    }
    
    // Circuit breaker parameters
    struct CircuitBreaker {
        bool isTriggered;
        uint256 cooldownPeriod;
        uint256 triggerTimestamp;
        uint256 priceDeviationThreshold; // in percentage (e.g., 10 = 10%)
    }
    
    // State variables
    uint256 private _nextOrderId;
    mapping(uint256 => Order) public orders;
    mapping(address => TradingPair) public tradingPairs;
    mapping(address => uint256[]) public userOrders;
    CircuitBreaker public circuitBreaker;
    
    // Events
    event OrderCreated(uint256 indexed orderId, address indexed trader, address tokenAddress, OrderType orderType, uint256 amount, uint256 price);
    event OrderFilled(uint256 indexed orderId, uint256 filledAmount, uint256 remainingAmount);
    event OrderCancelled(uint256 indexed orderId);
    event OrderExpired(uint256 indexed orderId);
    event TradingPairAdded(address tokenAddress, address priceFeedAddress);
    event TradingPairUpdated(address tokenAddress, bool isActive);
    event CircuitBreakerTriggered(address tokenAddress, uint256 timestamp);
    event CircuitBreakerReset(address tokenAddress, uint256 timestamp);
    event Trade(uint256 buyOrderId, uint256 sellOrderId, uint256 amount, uint256 price);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract with roles
     */
    function initialize(address admin) initializer public {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(CIRCUIT_BREAKER_ROLE, admin);
        
        _nextOrderId = 1;
        
        // Initialize circuit breaker
        circuitBreaker = CircuitBreaker({
            isTriggered: false,
            cooldownPeriod: 1 hours,
            triggerTimestamp: 0,
            priceDeviationThreshold: 10 // 10% price deviation
        });
    }

    /**
     * @dev Add a new trading pair
     */
    function addTradingPair(
        address tokenAddress, 
        address priceFeedAddress,
        uint256 minOrderSize,
        uint256 maxOrderSize,
        uint256 priceDecimals
    ) public onlyRole(ADMIN_ROLE) {
        require(tokenAddress != address(0), "Invalid token address");
        require(priceFeedAddress != address(0), "Invalid price feed address");
        
        tradingPairs[tokenAddress] = TradingPair({
            tokenAddress: tokenAddress,
            priceFeedAddress: priceFeedAddress,
            isActive: true,
            minOrderSize: minOrderSize,
            maxOrderSize: maxOrderSize,
            priceDecimals: priceDecimals
        });
        
        emit TradingPairAdded(tokenAddress, priceFeedAddress);
    }

    /**
     * @dev Update trading pair status
     */
    function updateTradingPairStatus(address tokenAddress, bool isActive) public onlyRole(ADMIN_ROLE) {
        require(tradingPairs[tokenAddress].tokenAddress != address(0), "Trading pair does not exist");
        
        tradingPairs[tokenAddress].isActive = isActive;
        
        emit TradingPairUpdated(tokenAddress, isActive);
    }

    /**
     * @dev Create a new buy order
     */
    function createBuyOrder(
        address tokenAddress, 
        uint256 amount, 
        uint256 price
    ) public whenNotPaused nonReentrant returns (uint256) {
        return _createOrder(tokenAddress, OrderType.BUY, amount, price);
    }

    /**
     * @dev Create a new sell order
     */
    function createSellOrder(
        address tokenAddress, 
        uint256 amount, 
        uint256 price
    ) public whenNotPaused nonReentrant returns (uint256) {
        return _createOrder(tokenAddress, OrderType.SELL, amount, price);
    }

    /**
     * @dev Internal function to create an order
     */
    function _createOrder(
        address tokenAddress, 
        OrderType orderType, 
        uint256 amount, 
        uint256 price
    ) internal returns (uint256) {
        TradingPair storage pair = tradingPairs[tokenAddress];
        require(pair.isActive, "Trading pair is not active");
        require(amount >= pair.minOrderSize, "Order size too small");
        require(amount <= pair.maxOrderSize, "Order size too large");
        require(!circuitBreaker.isTriggered, "Circuit breaker is active");
        
        // Check price deviation from oracle
        _checkPriceDeviation(tokenAddress, price);
        
        // For sell orders, transfer tokens to this contract
        if (orderType == OrderType.SELL) {
            CommodityToken token = CommodityToken(tokenAddress);
            require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        }
        
        // Create the order
        uint256 orderId = _nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            trader: msg.sender,
            tokenAddress: tokenAddress,
            orderType: orderType,
            amount: amount,
            price: price,
            timestamp: block.timestamp,
            status: OrderStatus.OPEN,
            filledAmount: 0
        });
        
        // Add to user orders
        userOrders[msg.sender].push(orderId);
        
        emit OrderCreated(orderId, msg.sender, tokenAddress, orderType, amount, price);
        
        // Try to match the order
        _matchOrder(orderId);
        
        return orderId;
    }

    /**
     * @dev Match an order with existing orders
     */
    function _matchOrder(uint256 orderId) internal {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.OPEN, "Order is not open");
        
        // Find matching orders
        uint256[] memory matchingOrderIds = _findMatchingOrders(order);
        
        // Process matches
        for (uint256 i = 0; i < matchingOrderIds.length && order.status == OrderStatus.OPEN; i++) {
            _processMatch(orderId, matchingOrderIds[i]);
        }
    }

    /**
     * @dev Find matching orders for a given order
     */
    function _findMatchingOrders(Order storage order) internal view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 maxMatches = 10; // Limit for gas optimization
        uint256[] memory potentialMatches = new uint256[](maxMatches);
        
        // Iterate through all orders to find matches
        for (uint256 i = 1; i < _nextOrderId && count < maxMatches; i++) {
            if (_isMatchingOrder(order, orders[i])) {
                potentialMatches[count++] = i;
            }
        }
        
        // Create properly sized array with matches
        uint256[] memory matches = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            matches[i] = potentialMatches[i];
        }
        
        return matches;
    }

    /**
     * @dev Check if two orders match
     */
    function _isMatchingOrder(Order storage order1, Order storage order2) internal view returns (bool) {
        return (
            order1.id != order2.id &&
            order2.status == OrderStatus.OPEN &&
            order1.tokenAddress == order2.tokenAddress &&
            order1.orderType != order2.orderType &&
            ((order1.orderType == OrderType.BUY && order1.price >= order2.price) ||
             (order1.orderType == OrderType.SELL && order1.price <= order2.price))
        );
    }

    /**
     * @dev Process a match between two orders
     */
    function _processMatch(uint256 orderId1, uint256 orderId2) internal {
        Order storage order1 = orders[orderId1];
        Order storage order2 = orders[orderId2];
        
        // Determine buy and sell orders
        Order storage buyOrder = order1.orderType == OrderType.BUY ? order1 : order2;
        Order storage sellOrder = order1.orderType == OrderType.SELL ? order1 : order2;
        
        // Calculate trade amount and price
        uint256 remainingAmount1 = order1.amount - order1.filledAmount;
        uint256 remainingAmount2 = order2.amount - order2.filledAmount;
        uint256 tradeAmount = remainingAmount1 < remainingAmount2 ? remainingAmount1 : remainingAmount2;
        uint256 tradePrice = sellOrder.price; // Use the sell price for the trade
        
        // Update filled amounts
        order1.filledAmount += tradeAmount;
        order2.filledAmount += tradeAmount;
        
        // Update order status if fully filled
        if (order1.filledAmount == order1.amount) {
            order1.status = OrderStatus.FILLED;
        }
        
        if (order2.filledAmount == order2.amount) {
            order2.status = OrderStatus.FILLED;
        }
        
        // Transfer tokens from seller to buyer
        CommodityToken token = CommodityToken(order1.tokenAddress);
        
        if (order1.orderType == OrderType.BUY) {
            token.transfer(order1.trader, tradeAmount);
        } else {
            token.transfer(order2.trader, tradeAmount);
        }
        
        // Emit events
        emit OrderFilled(order1.id, tradeAmount, order1.amount - order1.filledAmount);
        emit OrderFilled(order2.id, tradeAmount, order2.amount - order2.filledAmount);
        emit Trade(buyOrder.id, sellOrder.id, tradeAmount, tradePrice);
    }

    /**
     * @dev Cancel an order
     */
    function cancelOrder(uint256 orderId) public nonReentrant {
        Order storage order = orders[orderId];
        require(order.trader == msg.sender || hasRole(OPERATOR_ROLE, msg.sender), "Not authorized");
        require(order.status == OrderStatus.OPEN, "Order is not open");
        
        order.status = OrderStatus.CANCELLED;
        
        // Return tokens for sell orders
        if (order.orderType == OrderType.SELL && order.filledAmount < order.amount) {
            CommodityToken token = CommodityToken(order.tokenAddress);
            token.transfer(order.trader, order.amount - order.filledAmount);
        }
        
        emit OrderCancelled(orderId);
    }

    /**
     * @dev Check price deviation from oracle
     */
    function _checkPriceDeviation(address tokenAddress, uint256 orderPrice) internal view {
        TradingPair storage pair = tradingPairs[tokenAddress];
        AggregatorV3Interface priceFeed = AggregatorV3Interface(pair.priceFeedAddress);
        
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from oracle");
        
        uint256 oraclePrice = uint256(price);
        uint256 deviation;
        
        if (orderPrice > oraclePrice) {
            deviation = ((orderPrice - oraclePrice) * 100) / oraclePrice;
        } else {
            deviation = ((oraclePrice - orderPrice) * 100) / oraclePrice;
        }
        
        require(deviation <= circuitBreaker.priceDeviationThreshold, "Price deviation too high");
    }

    /**
     * @dev Trigger circuit breaker
     */
    function triggerCircuitBreaker() public onlyRole(CIRCUIT_BREAKER_ROLE) whenNotPaused {
        circuitBreaker.isTriggered = true;
        circuitBreaker.triggerTimestamp = block.timestamp;
        
        emit CircuitBreakerTriggered(address(0), block.timestamp);
    }

    /**
     * @dev Reset circuit breaker
     */
    function resetCircuitBreaker() public onlyRole(CIRCUIT_BREAKER_ROLE) {
        require(
            circuitBreaker.isTriggered && 
            block.timestamp >= circuitBreaker.triggerTimestamp + circuitBreaker.cooldownPeriod,
            "Cooldown period not elapsed"
        );
        
        circuitBreaker.isTriggered = false;
        
        emit CircuitBreakerReset(address(0), block.timestamp);
    }

    /**
     * @dev Update circuit breaker parameters
     */
    function updateCircuitBreakerParams(
        uint256 cooldownPeriod,
        uint256 priceDeviationThreshold
    ) public onlyRole(ADMIN_ROLE) {
        circuitBreaker.cooldownPeriod = cooldownPeriod;
        circuitBreaker.priceDeviationThreshold = priceDeviationThreshold;
    }

    /**
     * @dev Get user orders
     */
    function getUserOrders(address user) public view returns (uint256[] memory) {
        return userOrders[user];
    }

    /**
     * @dev Get order details
     */
    function getOrderDetails(uint256 orderId) public view returns (
        address trader,
        address tokenAddress,
        OrderType orderType,
        uint256 amount,
        uint256 price,
        uint256 timestamp,
        OrderStatus status,
        uint256 filledAmount
    ) {
        Order storage order = orders[orderId];
        return (
            order.trader,
            order.tokenAddress,
            order.orderType,
            order.amount,
            order.price,
            order.timestamp,
            order.status,
            order.filledAmount
        );
    }

    /**
     * @dev Pause the contract
     */
    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Required by the UUPS module
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
