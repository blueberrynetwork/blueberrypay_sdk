import { ethers } from 'ethers';
import { getAddress } from '@ethersproject/address';
import OrderBook from '../../../artifacts/src/contracts/BlueberryPayOrderBook.sol/BlueberryPayOrderBook.json';
import Router from '../../../artifacts/src/contracts/BlueberryPayRouter.sol/BlueberryPayRouter.json';
import ERC20 from '../../../artifacts/src/contracts/ERC20.sol/ERC20.json';
import { IPFSClient } from '../../../ipfs';
import { ContractConfig } from '../../../contractConfig';
import { calculateGasMargin, ISendToken, toWei } from '../../../shared/helper';

export class BlueberryPaySend {
  static ttl = 60 * 20;

  static addDataIPFS = async (title: string, file: any) => {
    const cid = await IPFSClient.storeData(title, file);
    return cid;
  };

  static getDataFromIPFS = async (cid: string) => {
    const jsonData = await IPFSClient.getStoredData(cid);
    return jsonData;
  };

  static sendTokenToSellerWithEscrow = async (args: ISendToken) => {
    console.log('sendTokenToSellerWithEscrow...');
    if (
      args.token !== undefined &&
      args.from !== undefined &&
      args.to !== undefined &&
      args.paymentSystemUID !== undefined &&
      args.amount !== undefined &&
      args.title !== undefined &&
      args.status !== undefined &&
      args.maturityTime !== undefined &&
      args.signer !== undefined
    ) {
      try {
        const deadline = Math.floor(Date.now() / 1000) + this.ttl;

        const token = new ethers.Contract(args.token, ERC20.abi, args.signer);

        const gasLimitApprove = await token
          .connect(args.signer)
          .estimateGas.approve(
            ContractConfig.ROUTER_ADDRESS,
            toWei(args.amount)
          );

        const tx0 = await token.approve(
          ContractConfig.ROUTER_ADDRESS,
          toWei(args.amount),
          {
            from: args.from,
            gasLimit: calculateGasMargin(gasLimitApprove),
          }
        );
        await tx0.wait(1);

        const routerContract = new ethers.Contract(
          ContractConfig.ROUTER_ADDRESS,
          Router.abi,
          args.signer
        );

        const argsSend = [
          args.token,
          args.to,
          args.paymentSystemUID,
          toWei(args.amount),
          ethers.utils.formatBytes32String(args.title),
          args.status,
          args.maturityTime,
          deadline,
        ];

        const gasLimit = await routerContract
          .connect(args.signer)
          .estimateGas.sendTokenToSellerWithEscrow(...argsSend);

        const tx1 = await routerContract
          .connect(args.signer)
          .sendTokenToSellerWithEscrow(...argsSend, {
            gasLimit: calculateGasMargin(gasLimit),
          });
        await tx1.wait(1);
        return { status: true, tx: tx1 };
      } catch (err: any) {
        console.log(err);
        return { status: false, tx: '' };
      }
    } else {
      console.log('Not logged in - params are undefined');
      return { status: false, tx: '' };
    }
  };

  static sendAVAXToSellerWithEscrow = async (args: any) => {
    if (
      args.token !== undefined &&
      args.from !== undefined &&
      args.to !== undefined &&
      args.paymentSystemUID !== undefined &&
      args.orderID !== undefined &&
      args.amount !== undefined &&
      args.title !== undefined &&
      args.status !== undefined &&
      args.signer !== undefined
    ) {
      try {
        const deadline = Math.floor(Date.now() / 1000) + this.ttl;

        const routerContract = new ethers.Contract(
          ContractConfig.ROUTER_ADDRESS,
          Router.abi,
          args.signer
        );

        const argsSend = [
          args.token,
          args.to,
          args.paymentSystemUID,
          args.orderID,
          args.status,
          ethers.utils.formatBytes32String(args.title),
          0, // maturitiyTime
          deadline,
        ];
        const gasLimit = await routerContract
          .connect(args.signer)
          .estimateGas.sendAVAXToSellerWithEscrow(...argsSend, {
            value: toWei(args.amount),
          });

        const tx1 = await routerContract
          .connect(args.signer)
          .sendAVAXToSellerWithEscrow(...argsSend, {
            value: toWei(args.amount),
            gasLimit: calculateGasMargin(gasLimit),
          });
        await tx1.wait(1);
        return { status: true, tx: tx1 };
      } catch (err: any) {
        console.log(err);
        return { status: false, tx: '' };
      }
    } else {
      console.log('Not logged in - params are undefined');
      return { status: true, tx: '' };
    }
  };

  static sendTokenWithoutEscrow = async (args: any) => {
    if (
      args.token !== undefined &&
      args.from !== undefined &&
      args.to !== undefined &&
      args.orderBookUID !== undefined &&
      args.amount !== undefined &&
      args.title !== undefined &&
      args.signer !== undefined
    ) {
      try {
        console.log('sendTokenWithoutEscrow..');
        const deadline = Math.floor(Date.now() / 1000) + this.ttl;

        const orderBook = new ethers.Contract(
          args.orderBookUID,
          OrderBook.abi,
          args.signer
        );

        const routerContract = new ethers.Contract(
          ContractConfig.ROUTER_ADDRESS,
          Router.abi,
          args.signer
        );
        const _orderID = await orderBook.getOrderIDCount();

        let firstData0: any, secondData1: any;
        let argsPass: any;
        if (args.title !== '' || args.file !== '') {
          const dataEncrypted = await this.addDataIPFS(args.title, args.file);
          firstData0 = dataEncrypted.toString().split('').slice(0, 31).join('');
          secondData1 = dataEncrypted.toString().split('').slice(31).join('');
          argsPass = {
            token: getAddress(args.token),
            to: getAddress(args.to),
            orderBookUID: getAddress(args.orderBookUID),
            orderID: _orderID.toString(),
            amount: args.amount,
            title: [
              ethers.utils.formatBytes32String(firstData0),
              ethers.utils.formatBytes32String(secondData1),
            ],
          };
        } else {
          argsPass = {
            token: getAddress(args.token),
            to: getAddress(args.to),
            orderBookUID: getAddress(args.orderBookUID),
            orderID: _orderID.toString(),
            amount: args.amount,
            title: [],
          };
        }

        const argsSend = [
          argsPass.token,
          argsPass.to,
          argsPass.orderBookUID,
          argsPass.orderID,
          argsPass.amount,
          argsPass.title,
          deadline,
        ];

        console.log(argsSend);

        const gasLimit = await routerContract
          .connect(args.signer)
          .estimateGas.sendTokenWithoutEscrow(...argsSend);

        const tx1 = await routerContract
          .connect(args.signer)
          .sendTokenWithoutEscrow(...argsSend, {
            gasLimit: calculateGasMargin(gasLimit),
          });

        await tx1.wait(1);
        return { status: true, tx: tx1 };
      } catch (err: any) {
        console.log(err);
        return { status: false, tx: '' };
      }
    } else {
      console.log('Not logged in - params are undefined');
      return { status: true, tx: '' };
    }
  };

  static sendAVAXToSellerWithoutEscrow = async (args: any) => {
    if (
      args.token !== undefined &&
      args.from !== undefined &&
      args.to !== undefined &&
      args.orderBookUID !== undefined &&
      args.amount !== undefined &&
      args.title !== undefined &&
      args.signer !== undefined
    ) {
      try {
        console.log('sendAVAXToSellerWithoutEscrow..');
        const deadline = Math.floor(Date.now() / 1000) + this.ttl;

        const orderBook = new ethers.Contract(
          args.orderBookUID,
          OrderBook.abi,
          args.signer
        );

        const routerContract = new ethers.Contract(
          ContractConfig.ROUTER_ADDRESS,
          Router.abi,
          args.signer
        );
        const _orderID = await orderBook.getOrderIDCount();
        let firstData0: any, secondData1: any;
        let argsPass: any;
        if (args.title !== '' || args.file !== '') {
          const dataEncrypted = await this.addDataIPFS(args.title, args.file);
          firstData0 = dataEncrypted.toString().split('').slice(0, 31).join('');
          secondData1 = dataEncrypted.toString().split('').slice(31).join('');
          argsPass = {
            token: getAddress(args.token),
            to: getAddress(args.to),
            orderBookUID: getAddress(args.orderBookUID),
            orderID: _orderID.toString(),
            title: [
              ethers.utils.formatBytes32String(firstData0),
              ethers.utils.formatBytes32String(secondData1),
            ],
          };
        } else {
          argsPass = {
            token: getAddress(args.token),
            to: getAddress(args.to),
            orderBookUID: getAddress(args.orderBookUID),
            orderID: _orderID.toString(),
            title: [],
          };
        }

        const argsSend = [
          argsPass.token,
          argsPass.to,
          argsPass.orderBookUID,
          argsPass.orderID,
          argsPass.title,
          deadline,
        ];

        const gasLimit = await routerContract
          .connect(args.signer)
          .estimateGas.sendAVAXWithoutEscrow(...argsSend, {
            value: toWei(args.amount),
          });

        const tx1 = await routerContract
          .connect(args.signer)
          .sendAVAXWithoutEscrow(...argsSend, {
            value: toWei(args.amount),
            gasLimit: calculateGasMargin(gasLimit),
          });

        await tx1.wait(1);
        return { status: true, tx: tx1 };
      } catch (err: any) {
        console.log(err);
        return { status: false, tx: '' };
      }
    } else {
      console.log('Not logged in - params are undefined');
      return { status: true, tx: '' };
    }
  };
}
