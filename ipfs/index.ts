import { Web3Storage, getFilesFromPath } from "web3.storage";
import CryptoJS from "crypto-js";

export class IPFSClient {
  static toBase64 = (file: any) => {
    try {
      if (file !== undefined) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });
      }
    } catch (e: any) {
      console.log(e);
    }
  };

  static encryptWithAES = async (data: any) => {
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      process.env.REACT_APP_SECRET
    ).toString();
  };

  static decryptWithAES = async (data: string) => {
    const bytes = CryptoJS.AES.decrypt(data, process.env.REACT_APP_SECRET);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  };

  static getAccessToken = async () => {
    // If you're just testing, you can paste in a token
    // and uncomment the following line:
    // return 'paste-your-token-here'

    // In a real app, it's better to read an access token from an
    // environement variable or other configuration that's kept outside of
    // your code base. For this to work, you need to set the
    // WEB3STORAGE_TOKEN environment variable before you run your code.
    return process.env.REACT_APP_WEB3STORAGE_TOKEN;
  };
  a;
  static makeStorageClient = async () => {
    return new Web3Storage({ token: await this.getAccessToken() });
  };

  static makeFileObjects = async (obj: any) => {
    // You can create File objects from a Blob of binary data
    // see: https://developer.mozilla.org/en-US/docs/Web/API/Blob
    // Here we're just storing a JSON object, but you can store images,
    // audio, or whatever you want!
    const encryptedData = await this.encryptWithAES(obj);
    const encryptedObj = { data: encryptedData };
    const blob = new Blob([JSON.stringify(encryptedObj)], {
      type: "application/json",
    });

    const files = [new File([blob], "data.json")];
    return files;
  };

  static storeData = async (_title: string, _file: any) => {
    try {
      let _fileType = "";
      if (_file !== undefined) {
        _fileType = _file.name.toString().split(".").pop();
      }
      const base64File = await this.toBase64(_file);
      const obj = { title: _title, file: base64File, fileType: _fileType };
      const client = await this.makeStorageClient();
      const data = await this.makeFileObjects(obj);
      const cid = await client.put(data);
      console.log("stored files with cid:", cid);
      return cid;
    } catch (e: any) {
      console.log(e);
    }
  };

  static getStoredData = async (cid: string) => {
    const client = await this.makeStorageClient();
    const res = await client.get(cid); // Web3Response
    const files = await res.files(); // Web3File[]
    for (const file of files) {
      const encryptedData = await file.text();

      if (JSON.parse(encryptedData)?.data) {
        const encryptedDataJSON = JSON.parse(encryptedData)?.data;
        const decryptedData = await this.decryptWithAES(encryptedDataJSON);
        const decryptedTitle = JSON.parse(decryptedData)?.title || "";
        const decryptedDoc = JSON.parse(decryptedData)?.file || "";
        const decryptedDocType = JSON.parse(decryptedData)?.fileType || "";
        return JSON.stringify({
          title: decryptedTitle,
          doc: decryptedDoc,
          fileType: decryptedDocType,
        });
      }
    }
  };
}
