import { ethers } from "ethers";
import { AuthInstances } from "../helper";

declare var window: any;

const AVALANCHE_PARAMS_TEST = {
  chainId: "0xA869",
  chainName: "AVAX TEST",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX", // 2-6 characters long
    decimals: 18,
  },
  rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
};

export class Web3Auth {
  static connectMetamask = async () => {
    const auth = new AuthInstances("", "", "");
    return auth;
  };
}

export class Web3AuthLocal {
  static account: any;
  static provider: any;
  static signer: any;
  static connectMetamask = async () => {
    if (typeof window !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        this.account = accounts[0];
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
      } catch (err: any) {
        console.log(err);
      }
    }

    const auth = new AuthInstances(this.account, this.provider, this.signer);

    return auth;
  };
}
export class Web3AuthTest {
  static account: any;
  static provider: any;
  static signer: any;
  static connectMetamask = async () => {
    if (typeof window !== "undefined") {
      try {
        await this.addNetworkAVAXTest();
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        this.account = accounts[0];
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
      } catch (err: any) {
        console.log(err);
      }
    }

    const auth = new AuthInstances(this.account, this.provider, this.signer);
    return auth;
  };

  //TEST NETWORK
  static addNetworkAVAXTest = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xA869" }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [AVALANCHE_PARAMS_TEST],
          });
        } catch (err: any) {
          console.log(err);
        }
      }
    }
  };
}
