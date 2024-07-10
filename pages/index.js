import {useState, useEffect, use} from "react";
import {ethers} from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);

  const [transactions, setTransactions] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [transactionHistoryShown, setTransactionHistoryShown] = useState(false);

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
      let tx = await atm.deposit(1);
      await tx.wait()
      getBalance();
    }
  }

  const withdraw = async() => {
    if (atm) {
      let tx = await atm.withdraw(1);
      await tx.wait()
      getBalance();
    }
  }

  const showTransactions = async() => {
    if (atm) {
      setIsHistoryLoading(true);
      try {
        let txs = await atm.getTransactions();
        setTransactions(txs);
      } catch (err) {
        console.log(err);
      } finally {
        setIsHistoryLoading(false);
      }
    }
  }

  const toggleTransactionHistory = () => {
    setTransactionHistoryShown(!transactionHistoryShown);

    if (transactionHistoryShown) {
      showTransactions();
    }
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
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance}</p>

        <div>
          <button onClick={deposit}>Deposit 1 ETH</button>
          <button onClick={withdraw}>Withdraw 1 ETH</button>
        </div>
        
        <button onClick={toggleTransactionHistory}>{
          transactionHistoryShown ? 
          "Hide Transaction History" : 
          "Show Transaction History"} 
        </button>

        {transactionHistoryShown && (
          <div>
          <h2>Transaction History</h2>

          {isHistoryLoading ? ( 
            <ul className = "transactionsList">
              {[...transactions].reverse().map((tx, index) => {
                let _type = "";
                let _amt = parseInt(tx.amount, 16);
                let _ft = "";

                if (tx.transactionType === 0) {
                  _type = "deposited";
                  _ft = "to"
                } else if (tx.transactionType === 1) {
                  _type = "withdrew";
                  _ft = "from"
                } 

                return (
                  <li key={index}>Transaction {transactions.length - index}: You {_type} {_amt} ETH {_ft} the ATM. </li>
                )
              })}
            </ul>
          ) : (
            <div>Loading Transactions...</div>
          )}
        </div>
        )}
        <style jsx>{`
          .transactionsList {
            list-style-type: none;
            padding: 0;
          }
          button {
            margin: 10px 10px 10px 10px;
          }
        `}
        </style>
      </div>
    )
  }

  useEffect(() => {getWallet();  }, []);

  useEffect(() => {
    showTransactions();
  }, [isHistoryLoading])

  return (
    <main className="container">
      <header><h1>Welcome to the Metacrafters ATM!</h1></header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center
        }
      `}
      </style>
    </main>
  )
}
