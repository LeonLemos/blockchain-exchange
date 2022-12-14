//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders; //Order's mapping
    mapping(uint256 => bool) public orderCancelled; //Keep registry of cancelled orders
    mapping(uint256 => bool) public orderFilled; //Keep registry of filled orders
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(uint256 id,address user,address tokenGet, uint256 amountGet,address tokenGive,uint256 amountGive, uint256 timestamp); 
    event Cancel(uint256 id,address user,address tokenGet, uint256 amountGet,address tokenGive,uint256 amountGive, uint256 timestamp); 
    event Trade(uint256 id,address user,address tokenGet, uint256 amountGet,address tokenGive,uint256 amountGive, address creator, uint256 timestamp); 
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
        orderCount++;
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

    function cancelOrder(uint256 _id) public {

        //Fetch order
        _Order storage _order = orders[_id];

        //Ensure the caller is the owner of order
        require(address(_order.user)==msg.sender);

        //Order must exist
        require(_order.id ==_id);

        //Cancel order
        orderCancelled[_id]=true;

        //Emit event
        emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, block.timestamp);

    }

    //Execute Order
    function fillOrder(uint256 _id) public{
        //Must be valid order
        require(_id > 0 && _id <= orderCount, 'Order does not exist');

        //Order cant be filled
        require(!orderFilled[_id]);

        //Order cant be cancelled
        require(!orderCancelled[_id]);

        //Fetch order
        _Order storage _order = orders[_id];

        //Swapping tokens(trading)
        _trade(
            _order.id, 
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive
        );

        //Mark order as filled
        orderFilled[_order.id]=true;

    }

    function _trade( 
        uint256 _orderId,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive ) 
        
        internal {
            //Do trade here...

            //Fee is deducted from _amountGet
            uint256 _feeAmount = (_amountGet*feePercent)/100;

            //From User 2 aka msg.sender, is the one filling the order + paying the fee, to User 1 ( made the order )
            tokens[_tokenGet][msg.sender]= tokens[_tokenGet][msg.sender] - (_amountGet+_feeAmount);
            tokens[_tokenGet][_user]= tokens[_tokenGet][_user]+_amountGet;

            //Charge Fee
            tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount]+ _feeAmount;

            //From User 1 to User 2 
            tokens[_tokenGive][_user] = tokens[_tokenGive][_user] - _amountGive;
            tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender] + _amountGive;

            emit Trade(_orderId, msg.sender,_tokenGet, _amountGet, _tokenGive, _amountGive, _user, block.timestamp);
    }
    
}


