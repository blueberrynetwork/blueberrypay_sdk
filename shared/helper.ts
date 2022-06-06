import { BigNumber, Bytes, ethers } from "ethers";

export enum States {
  Pending,
  Shipped,
  Canceled,
  Completed,
  NotDelivered,
}

export const toWei = (value: any) => ethers.utils.parseEther(value.toString());

export interface ISendToken {
  token: string;
  from: string;
  to: string;
  paymentSystemUID: string;
  amount: string | BigNumber;
  title: string;
  status: number;
  maturityTime: number;
  signer: any;
}

export interface IAuthInstance {
  account: string;
  provider: any;
  signer: any;
}

export interface IInit {
  paymentSystemOwner: string;
  paymentSytemID: string;
  signer: any;
}

export interface IWithDrawSeller {
  token: string;
  paymentSystemUID: string;
  orderBookUID: string;
  orderID: string;
  signer: any;
}

export interface IAddOrder {
  token: string;
  orderBookUID: string;
  to: string;
  amount: BigNumber;
  orderID: number;
  title: string[];
  status: number;
  maturityTime: number;
  signer: any;
}

export interface IConfirmShipmentFromMerchant {
  merchantID: string;
  orderID: string;
  state: States;
}

export class AuthInstances {
  constructor(
    public readonly account: string,
    public readonly provider: any,
    public readonly signer: any
  ) {}
}

export class ConnectionInstance {
  constructor(
    public readonly status: boolean,
    public readonly auth?: IAuthInstance
  ) {}
}

export const calculateGasMargin = (value: BigNumber) => {
  return value
    .mul(BigNumber.from(10000).add(BigNumber.from(1000)))
    .div(BigNumber.from(10000));
};
