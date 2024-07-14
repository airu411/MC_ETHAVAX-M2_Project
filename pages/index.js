import {useState, useEffect} from "react";
import {ethers} from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [showUserAddress, setShowUserAddress] = useState(false);

  const [taskName, setTaskName] = useState("New Task");
  const [tasks, setTasks] = useState([]);  
  const [showTasks, setShowTasks] = useState(true);

  const [activities, setActivities] = useState([]);
  const [showActivityHistory, setShowActivityHistory] = useState(false);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async() => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({method: "eth_accounts"});
      handleAccount(account);
    }
  }

  const handleAccount = (account) => {
    if (account) {
      console.log ("Account connected: ", account);
      setAccount(account);
    }
    else {
      console.log("No account found");
    }
  }

  const connectAccount = async() => {
    if (!ethWallet) {
      alert('MetaMask wallet is required to connect');
      return;
    }
  
    const accounts = await ethWallet.request({ method: 'eth_requestAccounts' });
    handleAccount(accounts);
    
    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);
 
    setATM(atmContract);
  }

  const getBalance = async() => {
    if (atm) {
      setBalance((await atm.getBalance()).toNumber());
    }
  }

  const addTask = async() => {
    if (atm) {
      let tx = await atm.addTask(taskName)
      await tx.wait()
      getAndSetTasks();
      getAndSetActivities();
    }
  }

  const completeTask = async(_taskID) => {
    if (atm) {
      let tx = await atm.completeTask(_taskID);
      await tx.wait()
      getBalance();
      getAndSetTasks();
      getAndSetActivities();
    }
  }

  const redeemRewards = async() => {
    if (atm) {
      let tx = await atm.getRewards();
      await tx.wait()
      getBalance();
      getAndSetActivities();
    }
  }

  const getAndSetActivities = async() => {
    if (atm) {
      let txs = await atm.getActivities();
      setActivities(txs);
    }
  }

  const getAndSetTasks = async() => {
    if (atm) {
      let txs = await atm.getTasks();
      setTasks(txs);
    }
  }

  const getTaskNames = (_taskID) => {
    // console.log("Task ID: ", _taskID);
    const task = tasks.find(task => task.taskID == _taskID);
    return task ? task.taskName : "";
  }

  const toggleUserAddress = () => {
    setShowUserAddress(!showUserAddress);
  }

  const toggleActivityHistory = () => {
    setShowActivityHistory(!showActivityHistory);
  }

  const toggleTasks = () => {
    setShowTasks(!showTasks);
  }


  const initUser = () => {
    // Check to see if user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return <button onClick={connectAccount}>Please connect your Metamask wallet</button>
    }

    if (balance == undefined) {
      getBalance();
    }

    return (
      <div>
        
        <div>
          <p>Your Account: 
            <button className="userAddressButton"
              onClick={toggleUserAddress}>
            {showUserAddress ? (
              <p className="userAddressShown">
                {account}
              </p>
            ) : (
              <p className="userAddressHidden">
                00000000000000000000000000000000000000
              </p>
            )
            }
            </button>
          </p>
        </div>

        <div className="rewardsContainer">
          <p>Your Current Rewards: {balance}</p>
          <button onClick={redeemRewards}>Redeem Rewards</button>
        </div>

        <div>
          <label>Task Name: </label>
          <input type="text" value={taskName}
            className="taskNameInput"
            onChange={(e) => setTaskName(e.target.value)} />
          <button onClick={addTask}>Add Task</button>
        </div>

        <div className="listContainer">

          <div className="listContainerChild">
            <button
              onClick={toggleTasks}>{
              showTasks ? 
              "Hide Tasks" : 
              "Show Tasks"} 
            </button>

            {showTasks && (
              <div>
                <h2>Your Current Tasks</h2>
                {tasks.length === 0 && 
                  <p>You don't have tasks yet.</p>
                }
                  <ul className = "list">
                    {[...tasks].reverse().map((tx, index) => {
                      let _ID = JSON.parse(tx.taskID, 16)
                      let _name = getTaskNames(_ID);

                      if (tx.isCompleted === false) {
                        return (
                          <li key={index}>
                            <b>Task #{_ID}: </b>  
                            {_name}
                            <button className="completeTaskButton"
                              onClick={() => completeTask(_ID)}>
                                Complete Task
                            </button>
                          </li>
                        )
                      }
                    })}
                  </ul>

              </div>
            )}

          </div>

          <div className="listContainerChild">
            <button
              onClick={toggleActivityHistory}>{
              showActivityHistory ? 
              "Hide Activity History" : 
              "Show Activity History"} 
            </button>

            {showActivityHistory && (
              <div>
                <h2>Activity History</h2>

                {activities.length === 0 && 
                  <p>You have no previous activity.</p>
                }

                  <ul className = "list">
                    {[...activities].reverse().map((tx, index) => {
                      let _type = "";
                      let _name = "";

                      if (tx.activityType === 0) { //ADD_TASK
                        _type = "added a new task: ";
                        _name = getTaskNames(JSON.parse(tx.taskID,16));
                      } else if (tx.activityType === 1) { //COMPLETE_TASK
                        _type = "completed the task: ";
                        _name = getTaskNames(JSON.parse(tx.taskID,16));
                      } else if (tx.activityType === 2) { //GET_REWARDS
                        _type = `redeemed your rewards 
                          (${JSON.parse(tx.amount,16)} ETH). 
                          Congratulations!`;
                      }

                      return (
                        <li key={index}>
                          <b>Activity #{activities.length - index}</b>: 
                          You {_type} {_name}
                        </li>
                      )
                    })}
                  </ul>

              </div>
            )}
          </div>

        </div>
      </div>
    )
  }

  useEffect(() => {
    getWallet(); 
  }, []);

  return (
    <main className="container">
      <header><h1>Welcome!</h1></header>
      <hr/>
      {initUser()}
    </main>
  )
}
