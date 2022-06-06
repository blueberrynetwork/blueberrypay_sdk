import { getAddress } from '@ethersproject/address';
import { ethers } from 'ethers';
import Router from '../../../artifacts/src/contracts/BlueberryPayRouter.sol/BlueberryPayRouter.json';
import { ContractConfig } from '../../../contractConfig';
import { IWithDrawSeller, calculateGasMargin } from '../../../shared/helper';

export class BlueberryPayWithdraw {
  static ttl = 60 * 20;

  static start = async () => {
    console.log('Start BlueberryPay');
  };

  static withDrawSeller = async (args: IWithDrawSeller) => {
    const deadline = Math.floor(Date.now() / 1000) + this.ttl;
    if (
      args.token !== undefined &&
      args.paymentSystemUID !== undefined &&
      args.orderBookUID !== undefined &&
      args.signer !== undefined
    ) {
      try {
        const routerContract = new ethers.Contract(
          ContractConfig.ROUTER_ADDRESS,
          Router.abi,
          args.signer
        );

        const argsPass = [
          getAddress(args.token),
          args.paymentSystemUID,
          args.orderBookUID,
          args.orderID,
          deadline,
        ];

        const gasLimit = await routerContract
          .connect(args.signer)
          .estimateGas.withDrawSeller(...argsPass);

        const tx = await routerContract
          .connect(args.signer)
          .withDrawSeller(...argsPass, {
            gasLimit: calculateGasMargin(gasLimit),
          });
        await tx.wait(1);
        return { status: true, tx: tx };
      } catch (err: any) {
        console.log(err);
        return { status: false, tx: '' };
      }
    } else {
      console.log('Params is undefined..');
      return { status: false, tx: '' };
    }
  };

  static withDrawSellerAVAX = async (args: IWithDrawSeller) => {
    const deadline = Math.floor(Date.now() / 1000) + this.ttl;
    if (
      args.token !== undefined &&
      args.paymentSystemUID !== undefined &&
      args.orderBookUID !== undefined &&
      args.orderID !== undefined &&
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
          args.paymentSystemUID,
          args.orderBookUID,
          args.orderID,
          deadline,
        ];

        const gasLimit = await routerContract
          .connect(args.signer)
          .estimateGas.withDrawSellerAVAX(...argsPass);

        const tx = await routerContract
          .connect(args.signer)
          .withDrawSellerAVAX(...argsPass, {
            gasLimit: calculateGasMargin(gasLimit),
          });
        await tx.wait(1);
        return { status: true, tx: tx };
      } catch (err: any) {
        console.log(err);
        return { status: false, tx: '' };
      }
    } else {
      console.log('Params is undefined..');
      return { status: false, tx: '' };
    }
  };
}
