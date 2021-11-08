import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
  'https://c.tenor.com/hIOlGyNoehEAAAAC/hologra-holo-graffiti.gif',
  'https://c.tenor.com/7UX8spygc8wAAAAd/hololive-nakiri-ayame.gif',
  'https://c.tenor.com/iQ-tmMIKsSkAAAAC/yo-dayo-nakiri.gif',
  'https://c.tenor.com/ygNn73iaQ7wAAAAC/hololive-subaru.gif',
  'https://c.tenor.com/SAmNsaoO3HEAAAAC/hololive-%E3%83%9B%E3%83%AD%E3%83%A9%E3%82%A4%E3%83%96.gif',
  'https://c.tenor.com/-ONQYN540p8AAAAd/%E7%99%BE%E9%AC%BC%E3%81%82%E3%82%84%E3%82%81-%E3%81%82%E3%82%84%E3%82%81.gif'
]

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
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

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  )

  const renderConnectedContainer = () => (
    <div className="connected-container">
      <div className="gif-grid">
        {TEST_GIFS.map(gif => (
          <div className="gif-item" key={gif}>
            <img src={gif} alt={gif} />
          </div>
        ))}
      </div>
    </div>
  );

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

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
          <div className="footer-container">
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`built on @${TWITTER_HANDLE}`}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
