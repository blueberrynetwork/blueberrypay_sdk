import { getAddress } from '@ethersproject/address';
import { ethers } from 'ethers';
import { ContractConfig } from '../../../contractConfig';
import { toWei, calculateGasMargin, IAddOrder } from '../../../shared/helper';
import Router from '../../../artifacts/src/contracts/BlueberryPayRouter.sol/BlueberryPayRouter.json';
import OrderBook from '../../../artifacts/src/contracts/BlueberryPayOrderBook.sol/BlueberryPayOrderBook.json';
import { IPFSClient } from '../../../ipfs';

export class BlueberryPayOrder {
  static ttl = 60 * 20;

  static addDataIPFS = async (title: string, file: any) => {
    const cid = await IPFSClient.storeData(title, file);
    return cid;
  };

  static getDataFromIPFS = async (cid: string) => {
    const jsonData = await IPFSClient.getStoredData(cid);
    return jsonData;
  };

  static addOrder = async (args: any) => {
    if (
      args.token !== undefined &&
      args.orderBookUID !== undefined &&
      args.to !== undefined &&
      args.amount !== undefined &&
      args.title !== undefined &&
      args.status !== undefined &&
      args.maturityTime !== undefined &&
      args.signer !== undefined
    ) {
      const orderBook = new ethers.Contract(
        args.orderBookUID,
        OrderBook.abi,
        args.signer
      );

      const _orderID = await orderBook.getOrderIDCount();

      const dataEncrypted = await this.addDataIPFS(args.title, args.file);
      const firstData0 = dataEncrypted
        .toString()
        .split('')
        .slice(0, 31)
        .join('');
      const secondData1 = dataEncrypted.toString().split('').slice(31).join('');

      const argsPass: IAddOrder = {
        token: getAddress(args.token),
        orderBookUID: getAddress(args.orderBookUID),
        to: getAddress(args.to),
        amount: toWei(args.amount),
        orderID: _orderID.toString(),
        title: [
          ethers.utils.formatBytes32String(firstData0),
          ethers.utils.formatBytes32String(secondData1),
        ],
        status: args.status,
        maturityTime: args.maturityTime,
        signer: args.signer,
      };

      try {
        const routerContract = new ethers.Contract(
          ContractConfig.ROUTER_ADDRESS,
          Router.abi,
          args.signer
        );

        const argsAddOrder = [
          argsPass.token,
          argsPass.orderBookUID,
          argsPass.to,
          argsPass.amount,
          argsPass.orderID,
          argsPass.title,
          argsPass.status,
          argsPass.maturityTime,
        ];

        const gasLimit = await routerContract
          .connect(args.signer)
          .estimateGas.addOrder(...argsAddOrder);

        const tx = await routerContract
          .connect(args.signer)
          .addOrder(...argsAddOrder, {
            gasLimit: calculateGasMargin(gasLimit),
          });

        await tx.wait(1);
        return { status: true, tx: tx };
      } catch (e: any) {
        console.log(e);
        return { status: false, tx: '' };
      }
    }
  };

  static cancelOrder = async (args: any) => {
    if (
      args.token !== undefined &&
      args.orderBookUID !== undefined &&
      args.orderID !== undefined &&
      args.status !== undefined &&
      args.signer !== undefined
    ) {
      try {
        const routerContract = new ethers.Contract(
          ContractConfig.ROUTER_ADDRESS,
          Router.abi,
          args.signer
        );

        const argsPass = [
          args.token,
          args.orderBookUID,
          args.orderID,
          args.status,
        ];
        const gasLimit = await routerContract
          .connect(args.signer)
          .estimateGas.cancelOrder(...argsPass);

        const tx = await routerContract
          .connect(args.signer)
          .cancelOrder(...argsPass, {
            gasLimit: calculateGasMargin(gasLimit),
          });
        await tx.wait(1);
        return { status: true, tx: tx };
      } catch (e: any) {
        console.log(e);
        return { status: false, tx: '' };
      }
    } else {
      console.log('Params is undefined..');
      return { status: false, tx: '' };
    }
  };

  static getOrderStatus = async (args: any) => {
    if (
      args.orderBookUID !== undefined &&
      args.orderID !== undefined &&
      args.provider !== undefined
    ) {
      const argsPass: any = [getAddress(args.orderBookUID), args.orderID];

      try {
        const routerContract = new ethers.Contract(
          ContractConfig.ROUTER_ADDRESS,
          Router.abi,
          args.provider
        );

        const status = await routerContract
          .connect(args.provider)
          .getOrderStatus(...argsPass);

        return status;
      } catch (e: any) {
        return { status: false, tx: '' };
      }
    }
  };

  static confirmReceiptTheCustomer = async (args: any) => {
    if (
      args.token !== undefined &&
      args.orderBookUID !== undefined &&
      args.orderID !== undefined &&
      args.signer !== undefined
    ) {
      if (args?.signer) {
        try {
          const routerContract = new ethers.Contract(
            ContractConfig.ROUTER_ADDRESS,
            Router.abi,
            args.signer
          );

          const gasLimit = await routerContract
            .connect(args.signer)
            .estimateGas.confirmReceiptTheCustomer(
              args.token,
              args.orderBookUID,
              args.orderID
            );

          const tx = await routerContract
            .connect(args.signer)
            .confirmReceiptTheCustomer(
              args.token,
              args.orderBookUID,
              args.orderID,
              {
                gasLimit: calculateGasMargin(gasLimit),
              }
            );
          await tx.wait(1);
          return true;
        } catch (err: any) {
          console.log(err);
          return false;
        }
      } else {
        console.log('Not logged in..');
        return false;
      }
    } else {
      console.log('Params is undefined..');
      return false;
    }
  };
}
