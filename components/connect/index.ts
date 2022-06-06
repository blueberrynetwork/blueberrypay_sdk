import { Web3Auth, Web3AuthLocal } from "../../shared/web3Auth";
import { IAuthInstance } from "../../shared/helper";

export class BlueberryPayConnect {
  static connectMetamask = async (testEnvironment?: boolean) => {
    const auth: IAuthInstance = testEnvironment
      ? await Web3AuthLocal.connectMetamask()
      : await Web3Auth.connectMetamask();

    return auth;
  };
}
