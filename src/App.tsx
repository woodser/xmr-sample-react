import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import assert from "assert";
import moneroTs from "monero-ts";

// set worker loader if not copied to public directory
//moneroTs.LibraryUtils.setWorkerLoader(() => new Worker(new URL("monero-ts/dist/monero.worker.js", import.meta.url)));

function App() {

  let sampleCodeRun = false;

  useEffect(() => {
    testSampleCode();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );

  async function testSampleCode() {
    if (sampleCodeRun) return;
    sampleCodeRun = true;

    console.log("Using monero-ts version: " + moneroTs.getVersion());

    // connect to mainnet daemon without worker proxy
    let daemon1 = await moneroTs.connectToDaemonRpc({server: "http://xmr-node.cakewallet.com:18081", proxyToWorker: false});
    console.log("Daemon height 1: " + await daemon1.getHeight());

    // connect to mainnet daemon with worker proxy
    let daemon2 = await moneroTs.connectToDaemonRpc({server: "http://xmr-node.cakewallet.com:18081", proxyToWorker: true});
    console.log("Daemon height 2: " + await daemon2.getHeight());
    let height = await daemon2.getHeight();            // 1523651
    let feeEstimate = await daemon2.getFeeEstimate();  // 1014313512
    let txsInPool = await daemon2.getTxPool();         // get transactions in the pool
    
    // create wallet from seed phrase using WebAssembly bindings to monero-project
    console.log("Creating wallet from seed phrase");
    let walletFull = await moneroTs.createWalletFull({
      password: "supersecretpassword123",
      networkType: moneroTs.MoneroNetworkType.MAINNET,
      seed: "fruit utensils auburn nabbing huts hexagon espionage fainted oxygen tattoo azure dash phase opened rotate owner grunt happens usage velvet rhythm deepest utensils velvet rotate",
      server: {
        uri: "http://xmr-node.cakewallet.com:18081",
      },
      restoreHeight: height - 1000
    });
    
    // synchronize with progress notifications
    console.log("Synchronizing wallet");
    await walletFull.sync(new class extends moneroTs.MoneroWalletListener {
      async onSyncProgress(height: number, startHeight: number, endHeight: number, percentDone: number, message: string) {
        //console.log("Sync progress: " + percentDone + "%");
      }
    });
    
    // synchronize in the background
    await walletFull.startSyncing(5000);
    
    // listen for incoming transfers
    let fundsReceived = false;
    await walletFull.addListener(new class extends moneroTs.MoneroWalletListener {
      async onOutputReceived(output: moneroTs.MoneroOutputWallet) {
        let amount = output.getAmount();
        let txHash = output.getTx().getHash();
        fundsReceived = true;
      }
    });
    // close wallets
    console.log("Closing wallets");
    await walletFull.close();
    console.log("Done running XMR sample app");
  }
}

export default App;
