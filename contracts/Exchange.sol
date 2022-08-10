//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders; //Order's mapping
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(uint256 id,address user,address tokenGet, uint256 amountGet,address tokenGive,uint256 amountGive, uint256 timestamp); 
    uint256 public orderCount; //Count orders

    struct _Order{
        //Attributes of an order
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp; //When order was created
    }

    constructor(address _feeAccount, uint256 _feePercent){
        feePercent = _feePercent;
        feeAccount = _feeAccount;
    }
    
    //Deposit & Withdraw Tokens
    function depositToken(address _token, uint256 _amount) public{
        //Tranfer token to exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));

        //Update user balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;

        //Emit an event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public{
        //Ensure user has enough tokens to withdraw
        require(tokens[_token][msg.sender]>=_amount);

        //Tranfer token to the user
        Token(_token).transfer(msg.sender, _amount);

        //Update user balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;

        //Emit an event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    //Check Balances
    function balanceOf(address _token, address _user) public view returns (uint256){
        return tokens[_token][_user];
    }

    //Make & Cancel Order
    //Token to Give, and Token to Get
    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {

        //Require order if tokens arent on exchange
        require(balanceOf(_tokenGive, msg.sender)>=_amountGive);

        //Instantiate a new Order
        orderCount = orderCount +1;
        orders[orderCount] = _Order(
            orderCount, 
            msg.sender, 
            _tokenGet, 
            _amountGet, 
            _tokenGive, 
            _amountGive, 
            block.timestamp);
        
        //Emit event
        emit Order(
            orderCount, 
            msg.sender, 
            _tokenGet, 
            _amountGet, 
            _tokenGive, 
            _amountGive, 
            block.timestamp);

    }
}


