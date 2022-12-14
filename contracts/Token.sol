//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token {
    string public name;
    string public symbol;
    uint256 public decimals = 18;
    uint256 public totalSupply;

    //Track Balance
    mapping(address=>uint256) public balanceOf;
    mapping(address=> mapping ( address => uint256)) public allowance; //Create mapping to approve allowances to spenders.

    //Create Transfer event
    event Transfer(
        address indexed from, 
        address indexed to, 
        uint256 value
    );

    //Create Approval event
    event Approval(
        address indexed owner,
        address indexed spender, 
        uint256 value
    ); 
    
    constructor(
        string memory _name, 
        string memory _symbol, 
        uint256 _totalSupply
    ) {
        name = _name;
        symbol=_symbol;
        totalSupply = _totalSupply*(10**decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer (address _to, uint256 _value) 
        public 
        returns (bool success)
    {
        //Require that sender has enough token to spend
        require(balanceOf[msg.sender] >= _value);

        _transfer(msg.sender, _to, _value);

        return true;
    }

    function _transfer(address _from, address _to, uint256 _value ) internal {

        //Not allow burning tokens
        require(_to != address(0));
        
        //Deduct tokens from spender
        balanceOf[_from] = balanceOf[_from] - _value; 

        //Credit tokens to receiver
        balanceOf[_to] = balanceOf[_to] + _value; 

        //Emit transfer Event
        emit Transfer(_from, _to, _value);


    }

    function approve(
        address _spender, 
        uint256 _value) 
        public 
        returns (bool success)
    {
        require(_spender != address(0)); //0 address cannot be spender

        allowance[msg.sender][_spender]=_value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    function transferFrom(
        address _from, 
        address _to, 
        uint256 _value) 
        public 
        returns ( bool success) 
    {
        //Check if spender has been approved to spend by owner
        require(balanceOf[_from] >= _value);  
        require(allowance[_from][msg.sender] >= _value);
       
       //Reset allowance to prevent double spend or unwanted spending
        allowance[_from][msg.sender] = allowance[_from][msg.sender] - _value;

        //Spend Tokens
        _transfer((_from), _to, _value);

        return true;

    }
}


