// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface for standard ERC20 token transfers.
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @title CryptPay
 * @dev Decentralized Payment Gateway & Subscription Manager.
 */
contract CryptPay {
    address public owner;
    uint256 public feePercentage; // e.g. 50 = 0.5% (scaled by 10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    struct Subscription {
        uint256 id;
        address subscriber;
        address merchant;
        address token;
        uint256 amount;
        uint256 interval;
        uint256 lastCharged;
        bool active;
    }
    
    uint256 private _subscriptionIdCounter;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public merchantSubscriptions;
    mapping(address => uint256[]) public subscriberSubscriptions;
    
    // Events
    event PaymentProcessed(
        string indexed linkId,
        address indexed customer,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 feeAmount,
        string paymentReference
    );
    
    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 interval
    );
    
    event SubscriptionCharged(
        uint256 indexed subscriptionId,
        uint256 amount,
        uint256 timestamp
    );
    
    event SubscriptionCancelled(uint256 indexed subscriptionId);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        feePercentage = 0; // 0% fees by default, fully decentralized and free
    }
    
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 500, "Fee cannot exceed 5%");
        feePercentage = _feePercentage;
    }
    
    function withdrawFees(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner).transfer(amount);
        } else {
            // Transfer ERC20 fees to owner
            (bool success, ) = token.call(
                abi.encodeWithSelector(0xa9059cbb, owner, amount) // transfer(address,uint256)
            );
            require(success, "Token withdrawal failed");
        }
    }
    
    /**
     * @dev Process native ETH payments.
     */
    function payETH(
        string calldata linkId,
        address payable merchant,
        string calldata paymentReference
    ) external payable {
        require(msg.value > 0, "Amount must be greater than zero");
        
        uint256 feeAmount = 0;
        uint256 merchantAmount = msg.value;
        
        if (feePercentage > 0) {
            feeAmount = (msg.value * feePercentage) / FEE_DENOMINATOR;
            merchantAmount = msg.value - feeAmount;
        }
        
        // Send funds to the merchant
        (bool success, ) = merchant.call{value: merchantAmount}("");
        require(success, "ETH transfer to merchant failed");
        
        emit PaymentProcessed(
            linkId,
            msg.sender,
            merchant,
            address(0),
            msg.value,
            feeAmount,
            paymentReference
        );
    }
    
    /**
     * @dev Process ERC20 token payments.
     */
    function payToken(
        string calldata linkId,
        address payable merchant,
        address token,
        uint256 amount,
        string calldata paymentReference
    ) external {
        require(amount > 0, "Amount must be greater than zero");
        require(token != address(0), "Invalid token address");
        
        uint256 feeAmount = 0;
        uint256 merchantAmount = amount;
        
        if (feePercentage > 0) {
            feeAmount = (amount * feePercentage) / FEE_DENOMINATOR;
            merchantAmount = amount - feeAmount;
        }
        
        // Transfer ERC20 from customer to this contract (fees) and to merchant
        IERC20 erc20 = IERC20(token);
        
        if (feeAmount > 0) {
            require(erc20.transferFrom(msg.sender, address(this), feeAmount), "Fee transfer failed");
        }
        require(erc20.transferFrom(msg.sender, merchant, merchantAmount), "Merchant transfer failed");
        
        emit PaymentProcessed(
            linkId,
            msg.sender,
            merchant,
            token,
            amount,
            feeAmount,
            paymentReference
        );
    }
    
    /**
     * @dev Create recurring pull subscription for ERC20 token.
     */
    function createSubscription(
        address merchant,
        address token,
        uint256 amount,
        uint256 interval
    ) external returns (uint256) {
        require(merchant != address(0), "Invalid merchant address");
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than zero");
        require(interval >= 1 days, "Interval must be at least 1 day");
        
        _subscriptionIdCounter++;
        uint256 subId = _subscriptionIdCounter;
        
        subscriptions[subId] = Subscription({
            id: subId,
            subscriber: msg.sender,
            merchant: merchant,
            token: token,
            amount: amount,
            interval: interval,
            lastCharged: block.timestamp - interval, // Can be charged immediately for initial payment
            active: true
        });
        
        merchantSubscriptions[merchant].push(subId);
        subscriberSubscriptions[msg.sender].push(subId);
        
        emit SubscriptionCreated(subId, msg.sender, merchant, token, amount, interval);
        return subId;
    }
    
    /**
     * @dev Charge active subscription. Can be called by the merchant.
     */
    function chargeSubscription(uint256 subscriptionId) external {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.active, "Subscription is not active");
        require(block.timestamp >= sub.lastCharged + sub.interval, "Subscription is not due yet");
        
        sub.lastCharged = block.timestamp;
        
        uint256 feeAmount = 0;
        uint256 merchantAmount = sub.amount;
        
        if (feePercentage > 0) {
            feeAmount = (sub.amount * feePercentage) / FEE_DENOMINATOR;
            merchantAmount = sub.amount - feeAmount;
        }
        
        IERC20 erc20 = IERC20(sub.token);
        
        // Execute transfers
        if (feeAmount > 0) {
            require(erc20.transferFrom(sub.subscriber, address(this), feeAmount), "Subscription fee failed");
        }
        require(erc20.transferFrom(sub.subscriber, sub.merchant, merchantAmount), "Subscription transfer failed");
        
        emit SubscriptionCharged(subscriptionId, sub.amount, block.timestamp);
    }
    
    /**
     * @dev Cancel active subscription.
     */
    function cancelSubscription(uint256 subscriptionId) external {
        Subscription storage sub = subscriptions[subscriptionId];
        require(msg.sender == sub.subscriber || msg.sender == sub.merchant, "Not authorized to cancel");
        require(sub.active, "Subscription already inactive");
        
        sub.active = false;
        emit SubscriptionCancelled(subscriptionId);
    }
    
    // View Helpers
    function getSubscriberSubscriptionsCount(address subscriber) external view returns (uint256) {
        return subscriberSubscriptions[subscriber].length;
    }
    
    function getMerchantSubscriptionsCount(address merchant) external view returns (uint256) {
        return merchantSubscriptions[merchant].length;
    }
}
