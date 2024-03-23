import { bytesToHex } from "./cryptography";
import { derivePath } from "ed25519-hd-key";
import * as bip39 from "@scure/bip39";
import { Account, Ed25519Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { aptos, pontemSdk } from "@/aptos-web3";
import { convertValueToDecimal } from "@pontem/liquidswap-sdk";
import { errorHandler, log } from "./handlers";

const path = "m/44'/637'/0'/0'/0'";

export function accountFromMnemonic(mnemonic: string) {
  const seed = bytesToHex(bip39.mnemonicToSeedSync(mnemonic));
  const { key } = derivePath(path, seed);
  const privateKeyBytes = new Uint8Array(key);

  const privateKey = new Ed25519PrivateKey(privateKeyBytes);
  const account = Account.fromPrivateKey({ privateKey });
  return account;
}

export async function registerCoinStore(
  account: Ed25519Account,
  coinType: string
) {
  const registerTxPayload = {
    function: "0x1::managed_coin::register",
    typeArguments: [coinType],
    arguments: [],
  };

  const registerTxn = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: registerTxPayload.function as `${string}::${string}::${string}`,
      typeArguments: registerTxPayload.typeArguments,
      functionArguments: registerTxPayload.arguments,
    },
  });

  const committedTransaction = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction: registerTxn,
  });

  return committedTransaction;
}

export async function swapToken(
  account: Ed25519Account,
  fromAmount: number,
  toToken: string
) {
  try {
    const poolExists = await pontemSdk.Liquidity.checkPoolExistence({
      fromToken: "0x1::aptos_coin::AptosCoin",
      toToken: toToken,
      curveType: "uncorrelated",
      version: 0,
    });

    if (!poolExists) {
      log(`Pool doesn't exist for ${toToken}`);
      return;
    }

    const address = account.accountAddress.toStringLong();
    const coinStoreType = `0x1::coin::CoinStore<${toToken}>`;
    const accountResources = await aptos.getAccountResources({
      accountAddress: account.accountAddress,
    });
    const isRegistered = accountResources.some(
      (resource) => resource.type === coinStoreType
    );

    if (!isRegistered) {
      const registerTxn = await registerCoinStore(account, toToken);
      log(`${address} registered for ${toToken} : ${registerTxn.hash}`);
    }

    const toAmount = await pontemSdk.Swap.calculateRates({
      fromToken: "0x1::aptos_coin::AptosCoin", // full 'from' token address
      toToken: toToken,
      amount: convertValueToDecimal(fromAmount, 8), // 1 APTOS, or you can use convertValueToDecimal(1, 8)
      curveType: "uncorrelated", // can be 'uncorrelated' or 'stable'
      interactiveToken: "from", // which token is 'base' to calculate other token rate.
      version: 0,
    });

    console.log(toAmount);

    // Generate TX payload for swap 1 APTOS to maximum 4.304638 USDT
    // and minimum 4.283115 USDT (with slippage -0.5%)
    const txPayload = pontemSdk.Swap.createSwapTransactionPayload({
      fromToken: "0x1::aptos_coin::AptosCoin",
      toToken: toToken,
      fromAmount: convertValueToDecimal(fromAmount, 8), // 1 APTOS, or you can use convertValueToDecimal(1, 8)
      toAmount: Number(toAmount), // 4.304638 USDT, or you can use convertValueToDecimal(4.304638, 6)
      interactiveToken: "from",
      slippage: 0.005, // 0.5% (1 - 100%, 0 - 0%)
      stableSwapType: "high",
      curveType: "uncorrelated",
      version: 0,
    });

    const swapTxn = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: txPayload.function as `${string}::${string}::${string}`,
        typeArguments: txPayload.type_arguments,
        functionArguments: txPayload.arguments,
      },
    });

    console.log(toAmount, txPayload);

    //   // using signAndSubmit combined
    //   const committedTransaction = await aptos.signAndSubmitTransaction({
    //     signer: account,
    //     transaction: swapTxn,
    //   });

    //   return committedTransaction;
  } catch (error) {
    errorHandler(error);
  }
}
