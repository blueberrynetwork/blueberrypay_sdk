import { ethers } from 'ethers';
import { ContractConfig } from '../../../contractConfig';
import { toWei, calculateGasMargin, IInit } from '../../../shared/helper';
import Router from '../../../artifacts/src/contracts/BlueberryPayRouter.sol/BlueberryPayRouter.json';

export class BlueberryPayCreatePayment {
  static ttl = 60 * 20;

  static init = async (args: IInit) => {
    if (
      args.paymentSystemOwner !== undefined &&
      args.paymentSytemID !== undefined &&
      args.signer !== undefined
    ) {
      if (args.signer) {
        try {
          const routerContract = new ethers.Contract(
            ContractConfig.ROUTER_ADDRESS,
            Router.abi,
            args.signer
          );

          const gasLimit = await routerContract
            .connect(args.signer)
            .estimateGas.createPaymentSystem(
              args.paymentSystemOwner,
              args.paymentSytemID
            );

          const tx = await routerContract
            .connect(args.signer)
            .createPaymentSystem(args.paymentSystemOwner, args.paymentSytemID, {
              gasLimit: calculateGasMargin(gasLimit),
            });

          await tx.wait(1);
          return true;
        } catch (err: any) {
          console.log(err);
          return false;
        }
      } else {
        console.log('init: Not logged in..');
        return false;
      }
    } else {
      console.log('init: Params is undefined..');
      return false;
    }
  };
}
