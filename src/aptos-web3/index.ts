import { SDK } from "@pontem/liquidswap-sdk";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export let pontemSdk = null as unknown as SDK;
export let aptos = null as unknown as Aptos;

export function rpcConfig() {
  pontemSdk = new SDK({ nodeUrl: "https://fullnode.mainnet.aptoslabs.com/v1" });
  const aptosConfig = new AptosConfig({ network: Network.MAINNET });
  aptos = new Aptos(aptosConfig);
}
