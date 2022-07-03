import { createAlchemyWeb3 } from "@alch/alchemy-web3";
import { useEffect, useState } from "react";
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';
import { useStatus } from "../context/statusContext";
import { connectWallet, getCurrentWalletConnected, getNFTPrice, getTotalMinted } from "../utils/interact.js";

const contractABI = require("../pages/contract-abi.json");
const contractAddress = "0xd373FcAb6e5b7B8afD3890A49e99fB58B18c76b6";
const web3 = createAlchemyWeb3(process.env.NEXT_PUBLIC_ALCHEMY_KEY);

const { MerkleTree } = require('merkletreejs');
const KECCAK256 = require('keccak256');
const addresses = require('../utils/addresses');

const leaves = addresses.map(x => KECCAK256(x));
const tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true })

const buf2hex = x => '0x' + x.toString('hex')




const nftContract = new web3.eth.Contract(
  contractABI,
  contractAddress
);

export default function Home() {

  //State variables
  const { status, setStatus } = useStatus();
  const [walletAddress, setWallet] = useState("");
  const [count, setCount] = useState(1);
  const [totalMinted, setTotalMinted] = useState(0);
  const [price, setPrice] = useState(0);

  useEffect(async () => {
    const { address, status } = await getCurrentWalletConnected();
    setWallet(address)
    setStatus(status);
    addWalletListener();
    setPrice(await getNFTPrice());
    updateTotalSupply();



  }, []);

  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus("👆🏽 Write a message in the text-field above.");
        } else {
          setWallet("");
          setStatus("🦊 Connect to Metamask using the top right button.");
        }
      });
    } else {
      setStatus(
        <p>
          {" "}
          🦊{" "}
          <a target="_blank" href={`https://metamask.io/download.html`}>
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.
          </a>
        </p>
      );
    }
  }

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
  };

  /** 
  const onMintPressed = async (e) => {
    e.preventDefault();

    let total = web3.utils.toWei(price, 'ether') * count;

    const tx = {
        'from': walletAddress,
        'to': contractAddress,
        'gas': 500000,
        'maxPriorityFeePerGas': 2500000000,
        'value': total,
        'data': nftContract.methods.mint(count).encodeABI()
    }
    await web3.eth.sendTransaction(tx);
}
*/



  const onMintPressed = async (e) => {
    e.preventDefault();
    let whitelistCheck = await nftContract.methods.onlyWhitelisted().call();
    let total = web3.utils.toWei(price, 'ether') * count;
    if (!whitelistCheck) {

      await nftContract.methods.mint(count).send({ from: walletAddress, value: total, gas: 500000 });

    }
    else {

      let leaf = buf2hex(KECCAK256(walletAddress));
      let proof = tree.getProof(leaf).map(x => buf2hex(x.data));
      await nftContract.methods.whitelistMint(count, proof).send({ from: walletAddress, value: total, gas: 3000000 })
    }

  };

  const incrementCount = async () => {
    let onlyWhitelisted = await nftContract.methods.onlyWhitelisted().call();
    if (!onlyWhitelisted) {


      if (count < 4) {
        setCount(count + 1);
      }
    }
    else {
      setCount(1);
    }
  };

  const decrementCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  const updateTotalSupply = async () => {
    const mintedCount = await getTotalMinted();
    setTotalMinted(mintedCount);
  };



  return (
    <>
      <Head>
        <title>Dapp Tutorial</title>
        <meta name="description" content="Simple NFT Dapp" />
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Header */}
      <header className='fixed w-full top-0 md:px-8 px-5 pt-5 pb-3 z-70 backdrop-blur transition-colors duration-500 z-40 flex-none md:z-50 bg-white/35 supports-backdrop-blur:bg-white/60 shadow-[0_2px_5px_rgba(3,0,16,0.2)]'>

        {/* Header Container */}
        <div className='flex h-full items-center justify-center max-w-11xl mx-auto border-opacity-0'>

          {/* Logo Section */}
          <div className='flex-grow'>
            <div className='flex'>
              <Link className='w-min-content' href='/' passHref>
                <a className='flex'>
                  <img alt='' src='/images/ascendantlogo_white.png' className='w-[100px]' />



                </a>
              </Link>
            </div>
          </div>

          {/* Desktop Navbar Section + Connect Wallet + icons */}
          <div className='items-center md:flex text-sm'>
            <ul className='flex space-x-2'>

              {/* CONNECT WALLET */}
              <li>
                {walletAddress.length > 0 ? (
                  <div className='px-4 bg-opacity-20 text-gray-100 items-center relative h-7 tracking-wider pt-0.5 first::pt-0 duration-500 text-sm md:text-base padding-huge opacity-100 hover:bg-opacity-70 rounded flex justify-center flex-row border border-yelloww hover:shadow-green-500/20 cursor-pointer'
                  >
                    Connected:  {String(walletAddress).substring(0, 6)}
                    {"....."}
                    {String(walletAddress).substring(39)}
                  </div>
                ) : (
                  <a className='px-4 bg-opacity-20 text-gray-900 font-semibold items-center relative h-7 tracking-wider pt-0.5 first::pt-0 duration-500 text-sm md:text-base padding-huge bg-yelloww opacity-100 hover:bg-opacity-70 rounded flex justify-center flex-row bg-gradient-to-tl hover:from-greenn from-yelloww to-yelloww hover:to-yelloww border-none hover:shadow-green-500/20 cursor-pointer'
                    id="walletButton"
                    onClick={connectWalletPressed}
                  >Connect Wallet
                  </a>
                )}
              </li>

              {/* Twitter Icon */}

            </ul>
          </div>

        </div>
      </header>

      {/* Hero/Mint Section */}
      <section className="flex items-center justify-center bg-pattern py-12 px-5 overflow-hidden relative z-10" id="">
        <div className="">
          {/* margin between header and hero section */}
          <div className="mb-5 flex items-center max-w-md mt-4"></div>

          <div className="flex flex-col items-center justify-center md:flex-row md:items-center md:justify-between text-slate-900 -mx-4">

            {/* Left Hero Section - Mint Info */}
            <div className="w-full px-4">
              <div className="max-w-[570px] mb-12 md:mb-0">
                <p className="animate-pulse text-2xl text-center md:text-4xl font-extrabold text-body-color leading-relaxed text-transparent bg-clip-text bg-gradient-to-tl stand__out__text from-white to-blue-300 uppercase mb-3 md:mb-8">
                  Available Now!
                </p>

                <div className="w-full px-4">
                  <div className="relative rounded-md p-8 shadow-md">
                    <video autoPlay loop muted poster='/images/secretbox.mpx' className='w-[400px] md:block rounded-lg'>
                      <source src='/images/secretbox.mp4' />
                    </video>

                  </div>
                </div>
              </div>



              {/* Total supply - Price info */}
              <div className='flex flex-col items-center justify-center text-black'>
                <div className='flex flex-col items-center justify-center text-black'>
                  <p className='text-gray-100 p-2'>{totalMinted}/7000 Minted</p>



                </div>
                <div className="flex items-center max-w-md mt-2"></div>
                <div className='mb-4 bg-pattern flex items-center justify-between rounded-md w-11/12 mx-auto p-2 border-2 border-gray-100 transition ease-in-out duration-500'>
                  <p className='font-bold text-gray-100'>Price Per Mint:</p>
                  <p className='font-bold text-gray-100'>{price} ETH</p>
                </div>

              </div>

              {/* Increment & Decrement buttons */}
              {walletAddress.length > 0 ? (
                <div className='flex flex-col'>
                  <div className='flex items-center justify-between px-16 sm:px-24 m-4'>
                    <button className='button w-10 h-10 flex items-center justify-center text-yelloww hover:shadow-lg bg-background font-bold rounded-md border border-opacity-80 border-yelloww'
                      onClick={decrementCount}
                    >
                      ــ
                    </button>
                    <p className="flex items-center justify-center flex-1 grow text-center font-bold text-yelloww text-2xl md:text-3xl">
                      {count}
                      {/* 1 */}
                    </p>
                    <button className="button w-10 h-10 flex items-center justify-center text-yelloww text-2xl hover:shadow-lg bg-background font-bold rounded-md border border-opacity-80 border-yelloww"
                      onClick={incrementCount}
                    >
                      +
                    </button>
                  </div>
                  <div className='flex items-center justify-center p-2 text-gray-100'>
                    Total: {Number.parseFloat((price * count).toFixed(3))} ETH +
                    <span className='text-gray-500'> Gas</span>
                  </div>
                  <div className='flex items-center justify-center'>
                    <button
                      className='text-lg font-semibold uppercase font-base text-black px-12 py-2 tracking-wide bg-gradient-to-tl from-yelloww hover:from-cyan-200 hover:to-cyan-500 to-yelloww rounded-md hover:shadow-green-500/20'
                      // onClick={mintPass}
                      onClick={onMintPressed}
                    >
                      Mint Now
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className='animate-pulse text-center flex flex-col font-bold text-gray-100 text-base md:text-2xl text-body-color leading-relaxed m-3 md:m-8 break-words ...'>
                    Connect Your Wallet To Mint
                  </p></>
              )}

            </div>
            {/* Total:  {nftPrice} + Gas */}
            {/* Mint Status */}
            {/* {status && (
      <div className="flex items-center justify-center">
        {status}
      </div>
    )} */}

          </div>

          {/* Right Hero Section - Video/Image Bird PASS */}

        </div>
      </section>

      {/* Content + footer Section */}
      <Footer />
    </>
  )
}

