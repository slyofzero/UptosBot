import { Bot } from "grammy";
import { initiateBotCommands, initiateCallbackQueries } from "./bot";
import { log } from "./utils/handlers";
import { BOT_TOKEN } from "./utils/env";
import { aptos, rpcConfig } from "./aptos-web3";
import { accountFromMnemonic, swapToken } from "./utils/web3";

export const teleBot = new Bot(BOT_TOKEN || "");
log("Bot instance ready");

// Check for new transfers at every 20 seconds
const interval = 20;

const mnemonic =
  "front degree erase amused tray salute income caught casual blur oil negative";

(async function () {
  rpcConfig();
  teleBot.start();
  log("Telegram bot setup");
  initiateBotCommands();
  initiateCallbackQueries();

  const account = accountFromMnemonic(mnemonic);
  const toToken =
    "0x73eb84966be67e4697fc5ae75173ca6c35089e802650f75422ab49a8729704ec::coin::DooDoo"; // Replace with the CoinType you're interested in

  const swapTxn = await swapToken(account, 0.065, toToken);
  console.log(swapTxn);

  // async function toRepeat() {
  //   //
  //   setTimeout(toRepeat, interval * 1e3);
  // }
  // await toRepeat();
})();
