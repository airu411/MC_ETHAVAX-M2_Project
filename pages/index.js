import {useState, useEffect, use} from "react";
import {ethers} from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [rcvrAddress, setRcvrAddress] = useState("");
  const [amount, setAmount] = useState(1);

  const [transactions, setTransactions] = useState([]);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [receiverAddressShown, setReceiverAddressShown] = useState({});

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

  const deposit = async() => {
    if (atm) {
      let tx = await atm.deposit(amount);
      await tx.wait()
      getBalance();
      getAndSetTransactions();
    }
  }

  const withdraw = async() => {
    if (atm) {
      let tx = await atm.withdraw(amount);
      await tx.wait()
      getBalance();
      getAndSetTransactions();
    }
  }

  const transfer = async() => {
    if (atm) {
      let tx = await atm.transfer(rcvrAddress, amount);
      await tx.wait()
      getBalance();
      getAndSetTransactions();
    }
  }

  const getAndSetTransactions = async() => {
    if (atm) {
      let txs = await atm.getTransactions();
      setTransactions(txs);
    }
  }

  const toggleTransactionHistory = () => {
    setShowTransactionHistory(!showTransactionHistory);
    getAndSetTransactions();
  }

  const toggleReceiverAddress = (index) => {
    setReceiverAddressShown(prevState => ({
      ...prevState,
      [index]: !prevState[index]
    }));
  };


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
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance}</p>

        <div>
          <label>Amount: </label>
          <input type="text" value={amount}
            onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div>
          <button onClick={deposit}>Deposit ETH</button>
          <button onClick={withdraw}>Withdraw ETH</button>
        </div>

        <div>
          <label>Send to: </label>
          <input type="text" value={rcvrAddress}
            onChange={(e) => setRcvrAddress(e.target.value)} />
          <button onClick={transfer}>Transfer ETH</button>
        </div>
        
        <button
          onClick={toggleTransactionHistory}>{
          showTransactionHistory ? 
          "Hide Transaction History" : 
          "Show Transaction History"} 
        </button>

        {showTransactionHistory && (
          <div>
            <h2>Transaction History</h2>

              <ul className = "transactionsList">
                {[...transactions].reverse().map((tx, index) => {
                  let _type = "";
                  let _amt = parseInt(tx.amount);
                  let _ft = "";
                  let _rcvr = "";
                  let receiverButtonStyle = {
                    padding: 0,
                    border: "none",
                    background: "none",
                  }

                  if (tx.transactionType === 0) {
                    _type = "deposited";
                    _ft = "to";
                    _rcvr = "the ATM";
                  } else if (tx.transactionType === 1) {
                    _type = "withdrew";
                    _ft = "from";
                    _rcvr = "the ATM";
                  } else if (tx.transactionType === 2) {
                    _type = "transferred";
                    _ft = "to";

                    _rcvr = receiverAddressShown[transactions.length - index] ? 
                      tx.receiverAddress : "000000000000000000000000000000000000000000";
                    if (_rcvr === "000000000000000000000000000000000000000000") {
                      receiverButtonStyle = {
                        padding: 0,
                        border: "none",
                        background: "black",
                        color: "black",
                      }
                    }
                  }

                  return (
                    <li key={index}>
                      <b>Transaction #{transactions.length - index}</b>: 
                      You {_type} {_amt} ETH {_ft} 
                      <button style={receiverButtonStyle} 
                        onClick={() => toggleReceiverAddress(transactions.length - index)}>
                        {_rcvr} 
                      </button>
                    </li>
                  )
                })}
              </ul>

          </div>
        )}
      </div>
    )
  }

  useEffect(() => {getWallet();  }, []);

  return (
    <main className="container">
      <header><h1>Welcome to the Metacrafters ATM!</h1></header>
      {initUser()}
    </main>
  )
}
