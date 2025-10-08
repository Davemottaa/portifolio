// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DaviMotaToken (DMT)
 * @dev ERC-20 Token with Faucet functionality
 * @author Davi Mota
 */

contract DaviMotaToken {
    string public name = "Davi Mota Token";
    string public symbol = "DMT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    uint256 public faucetAmount = 100 * 10**18; // 100 DMT per claim
    uint256 public cooldownTime = 24 hours;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public lastClaimTime;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TokensClaimed(address indexed claimer, uint256 amount);
    event FaucetAmountUpdated(uint256 newAmount);
    event CooldownTimeUpdated(uint256 newTime);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply * 10**decimals;
        balanceOf[address(this)] = totalSupply; // All tokens to contract for faucet
        emit Transfer(address(0), address(this), totalSupply);
    }
    
    /**
     * @dev Transfer tokens
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    /**
     * @dev Approve spending
     */
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    /**
     * @dev Transfer from approved address
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    /**
     * @dev Faucet claim function - users can claim tokens once per cooldown period
     */
    function claim() public returns (bool success) {
        require(balanceOf[address(this)] >= faucetAmount, "Faucet is empty");
        require(
            block.timestamp >= lastClaimTime[msg.sender] + cooldownTime,
            "Cooldown period not passed yet"
        );
        
        lastClaimTime[msg.sender] = block.timestamp;
        balanceOf[address(this)] -= faucetAmount;
        balanceOf[msg.sender] += faucetAmount;
        
        emit Transfer(address(this), msg.sender, faucetAmount);
        emit TokensClaimed(msg.sender, faucetAmount);
        
        return true;
    }
    
    /**
     * @dev Check if user can claim (cooldown passed)
     */
    function canClaim(address _user) public view returns (bool) {
        return block.timestamp >= lastClaimTime[_user] + cooldownTime;
    }
    
    /**
     * @dev Get time until next claim is available
     */
    function timeUntilNextClaim(address _user) public view returns (uint256) {
        if (canClaim(_user)) {
            return 0;
        }
        return (lastClaimTime[_user] + cooldownTime) - block.timestamp;
    }
    
    /**
     * @dev Get faucet balance
     */
    function faucetBalance() public view returns (uint256) {
        return balanceOf[address(this)];
    }
    
    /**
     * @dev Update faucet amount (owner only)
     */
    function setFaucetAmount(uint256 _newAmount) public onlyOwner {
        faucetAmount = _newAmount;
        emit FaucetAmountUpdated(_newAmount);
    }
    
    /**
     * @dev Update cooldown time (owner only)
     */
    function setCooldownTime(uint256 _newTime) public onlyOwner {
        cooldownTime = _newTime;
        emit CooldownTimeUpdated(_newTime);
    }
    
    /**
     * @dev Refill faucet (owner only)
     */
    function refillFaucet(uint256 _amount) public onlyOwner {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        balanceOf[msg.sender] -= _amount;
        balanceOf[address(this)] += _amount;
        emit Transfer(msg.sender, address(this), _amount);
    }
    
    /**
     * @dev Withdraw tokens from faucet (owner only, emergency)
     */
    function withdrawFromFaucet(uint256 _amount) public onlyOwner {
        require(balanceOf[address(this)] >= _amount, "Insufficient faucet balance");
        balanceOf[address(this)] -= _amount;
        balanceOf[msg.sender] += _amount;
        emit Transfer(address(this), msg.sender, _amount);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}