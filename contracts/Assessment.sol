// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

//import "hardhat/console.sol";

contract Assessment {
    address payable public owner;
    mapping(address => uint256) public balances;

    event AddTask(address indexed userAddress, uint256 taskID, string taskName);
    event CompleteTask(address indexed userAddress, uint256 taskID, string taskName);
    event UpdateBalance(address indexed userAddress, uint256 amount);
    event GetReward(address indexed userAddress, uint256 amount);

    // For now, 3 tasks = 1 ETH added to the user's balance
    uint256 taskPerReward = 3; 
    uint256 numOfTasks = 0; 
    uint256 numOfCompletedTasks = 0;

    Task[] public tasks;
    Activity[] public activities;

    enum ActivityType { ADD_TASK, COMPLETE_TASK, GET_REWARDS }

    struct Task {
      uint256 taskID;
      string taskName;
      bool isCompleted;
    }

    struct Activity {
      ActivityType activityType;
      uint256 taskID;
      address receiverAddress;
      uint256 amount;
    }

    constructor(uint initBalance) payable {
        owner = payable(msg.sender);
        balances[msg.sender] = initBalance;
    }

    function getBalance() public view returns(uint256){
        return balances[msg.sender];
    }

    function addTask(string memory _taskName) public {
      require(msg.sender == owner, "You are not the owner of this account.");
      
      // check if the task already exists
      for (uint i = 0; i < tasks.length; i++) {
        if (keccak256(abi.encodePacked(tasks[i].taskName)) == keccak256(abi.encodePacked(_taskName))) {
          if (!tasks[i].isCompleted) {
            revert("There is already a similar task with that name.");
          }
        }
      }

      numOfTasks++;

      tasks.push(
        Task(
          numOfTasks,
          _taskName, 
          false
        )
      );

      activities.push(
        Activity(
          ActivityType.ADD_TASK, 
          numOfTasks,
          owner, 
          0)
        );

      // emit the event
      emit AddTask(owner, numOfTasks, _taskName);
    }

    function completeTask(uint256 _taskID) public {
      bool found = false;
      
      // check if the task exists and is not completed yet
      for (uint i = 0; i < tasks.length; i++) {
          if (keccak256(abi.encodePacked(tasks[i].taskID)) == keccak256(abi.encodePacked(_taskID))) {
              if (!tasks[i].isCompleted) {
                tasks[i].isCompleted = true;
                found = true;

                activities.push(
                  Activity(
                    ActivityType.COMPLETE_TASK,  
                    tasks[i].taskID,
                    msg.sender, 
                    0
                  )
                );

                numOfCompletedTasks++;

                // emit the event
                emit CompleteTask(msg.sender, tasks[i].taskID, tasks[i].taskName);

                break;
              } else {
                revert("Task is already completed!");  
              }
          }
      }
      
      if (!found) {
          revert("There is no such task!");
      }

      updateBalance();
    }

    function updateBalance() public {
      require(msg.sender == owner, "You are not the owner of this account");

      // if numOfCompletedTasks is divisible by taskPerReward, 
      // add 1 to the balance and reset the numOfCompletedTasks
      if (numOfCompletedTasks % taskPerReward == 0) {
        balances[owner] += 1;
        numOfCompletedTasks = 0;

        emit UpdateBalance(owner, balances[owner]);
      }
    }

    function getRewards() public {
        require(msg.sender == owner, "You are not the owner of this account");
        require(balances[owner] > 0, "You have no rewards to claim");

        uint _previousBalance = balances[owner];
        balances[owner] = 0; 
        assert(balances[owner] == 0);

        activities.push(
          Activity(
            ActivityType.GET_REWARDS, 
            0,
            owner, 
            _previousBalance
          )
        );

        emit GetReward(owner, _previousBalance);
    }

    function getTasks() public view returns(Task[] memory) {
      require(msg.sender == owner, "You are not the owner of this account");
      return tasks;
    }

    function getActivities() public view returns(Activity[] memory) {
      require(msg.sender == owner, "You are not the owner of this account");
      return activities;
    }
}
