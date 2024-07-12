// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

//import "hardhat/console.sol";

contract Assessment {
    address payable public owner;
    mapping(address => uint256) public balances;

    event Deposit(uint256 amount);
    event Withdraw(uint256 amount);
    event Transfer(address indexed senderAddress, address indexed receiverAddress, uint256 amount);

    enum TransactionType { DEPOSIT, WITHDRAW, TRANSFER }  

    struct Transaction {
      TransactionType transactionType;
      address receiverAddress;
      address senderAddress;
      uint256 amount;
    }

    Transaction[] public transactions;

    constructor(uint initBalance) payable {
        owner = payable(msg.sender);
        balances[msg.sender] = initBalance;
    }

    function getBalance() public view returns(uint256){
        return balances[msg.sender];
    }

    function deposit(uint256 _amount) public payable {
        uint _previousBalance = balances[msg.sender];

        // make sure this is the owner
        require(msg.sender == owner, "You are not the owner of this account");

        // perform transaction
        balances[owner] += _amount;

        // assert transaction completed successfully
        assert(balances[owner] == _previousBalance + _amount);

        // emit the event
        emit Deposit(_amount);

        // add the transaction
        transactions.push(Transaction(TransactionType.DEPOSIT, address(this), owner, _amount));
    }

    // custom error
    error InsufficientBalance(uint256 balance, uint256 amount);

    function withdraw(uint256 _withdrawAmount) public {
        require(msg.sender == owner, "You are not the owner of this account");
        
        uint _previousBalance = balances[owner];

        if (balances[owner] < _withdrawAmount) {
            revert InsufficientBalance({
                balance: balances[owner],
                amount: _withdrawAmount
            });
        }

        // withdraw the given amount
        balances[owner] -= _withdrawAmount;

        // assert the balance is correct
        assert(balances[owner] == (_previousBalance - _withdrawAmount));

        // emit the event
        emit Withdraw(_withdrawAmount);

        // add the transaction
        transactions.push(Transaction(TransactionType.WITHDRAW, owner, address(this), _withdrawAmount));
    }

    function transfer(address payable _receiverAddress, uint256 _transferAmount) public {
        require(msg.sender == owner, "You are not the owner of this account");

        if (balances[owner] < _transferAmount) {
            revert InsufficientBalance({
                balance: balances[owner],
                amount: _transferAmount
            });
        }

        balances[owner] -= _transferAmount;
        balances[_receiverAddress] += _transferAmount;

        emit Transfer(owner, _receiverAddress, _transferAmount);

        transactions.push(Transaction(TransactionType.TRANSFER, _receiverAddress, owner, _transferAmount));
    }

    function getTransactions() public view returns(Transaction[] memory) {
      require(msg.sender == owner, "You are not the owner of this account");
      return transactions;
    }
}
