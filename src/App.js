import { useEffect, useState } from 'react';
// import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import kp from './keypair.json'
import idl from './idl.json';

// SystemProgram is a reference to the Solana runtime
const { SystemProgram } = web3;
const arr = Object.values(kp._keypair.secretKey)
const secretKey = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secretKey)

// Create a keypair for the account that will hold the GIF data.
// let baseAccount = Keypair.generate();

// Get program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Control how to acknowledggements are done when a transaction is done.
// Basically can choose how long we want to wait for a transaction to be completed, "finalized" or "processed" etc
// E.g do we wait for the one node to acknowledge our transaction or the whole Solana chain to acknowledge?
const opts = {
  preflightCommitment: "processed"
}

// Constants
// const TWITTER_HANDLE = '_buildspace';
// const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// const TEST_GIFS = [
//   'https://c.tenor.com/hIOlGyNoehEAAAAC/hologra-holo-graffiti.gif',
//   'https://c.tenor.com/7UX8spygc8wAAAAd/hololive-nakiri-ayame.gif',
//   'https://c.tenor.com/iQ-tmMIKsSkAAAAC/yo-dayo-nakiri.gif',
//   'https://c.tenor.com/ygNn73iaQ7wAAAAC/hololive-subaru.gif',
//   'https://c.tenor.com/SAmNsaoO3HEAAAAC/hololive-%E3%83%9B%E3%83%AD%E3%83%A9%E3%82%A4%E3%83%96.gif',
//   'https://c.tenor.com/-ONQYN540p8AAAAd/%E7%99%BE%E9%AC%BC%E3%81%82%E3%82%84%E3%82%81-%E3%81%82%E3%82%84%E3%82%81.gif'
// ]

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');

          /*
           * The solana object gives us a function that will allow us to connect
           * directly with the user's wallet!
           */
          const response = await solana.connect();
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          // Set the user's publickey in state to be used later!
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
        window.open("https://phantom.app/", "_blank");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
    else {
      window.open("https://phantom.app/", "_blank");
    }
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch (error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      alert("Please enter a GIF URL!")
      return;
    }
    console.log('Gif link: ', inputValue)
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider)

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        }
      });
      console.log("GIF successfully sent to program", inputValue);

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  )

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button className="cta-button submit-gif-button" onClick={sendGif}>
            Submit
          </button>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img alt='loading' src={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (error) {
      console.error('Error in getGifs', error);
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="container">
          <div className="header-container">
            <p className="header">Ayame GIF Portal</p>
            <p className="sub-text">
              View your Ayame GIF collection in the metaverse ✨
            </p>
            {!walletAddress && renderNotConnectedContainer()}
            {walletAddress && renderConnectedContainer()}
          </div>
          {/* <div className="footer-container">
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`built on @${TWITTER_HANDLE}`}</a>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default App;
