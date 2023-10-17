import { ethers } from "ethers";
import { getContract } from "./Addresses";

const TOKENS = {
  56: [
    {
      name: "Bitcoin (BTCB)",
      symbol: "BTC",
      decimals: 18,
      address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
      coingeckoUrl: "https://www.coingecko.com/en/coins/binance-bitcoin",
      imageUrl: "https://assets.coingecko.com/coins/images/14108/small/Binance-bitcoin.png",
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      coingeckoUrl: "https://www.coingecko.com/en/coins/ethereum",
      imageUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    },
    {
      name: "Binance Coin",
      symbol: "BNB",
      decimals: 18,
      address: ethers.constants.AddressZero,
      coingeckoUrl: "https://www.coingecko.com/en/coins/binance-coin",
      imageUrl: "https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png",
      isNative: true,
    },
    {
      name: "Wrapped Binance Coin",
      symbol: "WBNB",
      decimals: 18,
      address: getContract(56, "NATIVE_TOKEN"),
      isWrapped: true,
      coingeckoUrl: "https://www.coingecko.com/en/coins/binance-coin",
      imageUrl: "https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png",
      baseSymbol: "BNB",
    },
    {
      name: "USD Gambit",
      symbol: "USDG",
      decimals: 18,
      address: getContract(56, "USDG"),
      isUsdg: true,
      coingeckoUrl: "https://www.coingecko.com/en/coins/usd-gambit",
      imageUrl: "https://assets.coingecko.com/coins/images/15886/small/usdg-02.png",
    },
    {
      name: "Binance USD",
      symbol: "BUSD",
      decimals: 18,
      address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
      isStable: true,
      coingeckoUrl: "https://www.coingecko.com/en/coins/binance-usd",
      imageUrl: "https://assets.coingecko.com/coins/images/9576/small/BUSD.png",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 18,
      address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      isStable: true,
      coingeckoUrl: "https://www.coingecko.com/en/coins/usd-coin",
      imageUrl: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    },
    {
      name: "Tether",
      symbol: "USDT",
      decimals: 18,
      address: "0x55d398326f99059fF775485246999027B3197955",
      isStable: true,
      coingeckoUrl: "https://www.coingecko.com/en/coins/tether",
      imageUrl: "https://assets.coingecko.com/coins/images/325/small/Tether-logo.png",
    },
  ],
  97: [
    {
      name: "Binance Coin",
      symbol: "BNB",
      decimals: 18,
      address: ethers.constants.AddressZero,
      priceFeed: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526',
      isNative: true,
      isShortable: true,
    },
    {
      name: "Wrapped Binance Coin",
      symbol: "WBNB",
      decimals: 18,
      address: "0x612777Eea37a44F7a95E3B101C39e1E2695fa6C2",
      priceFeed: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526',
      isWrapped: true,
      baseSymbol: "BNB",
      isTempHidden: true
    },
    {
      name: "Bitcoin (BTCB)",
      symbol: "BTC",
      decimals: 18,
      address: "0xD0012417C1b2CeB51a34a6774e3389F86863fb9a",
      priceFeed: '0x5741306c21795FdCBb9b265Ea0255F499DFe515C',
      isShortable: true,
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: "0x54759f7b3D68c211ffb403262f079d9eAd65CD68",
      priceFeed: '0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7',
      isShortable: true,
    },
    {
      name: "Binance USD",
      symbol: "BUSD",
      decimals: 18,
      address: "0xD0cb965cB56d884ea04C12CeFc2417504d12a73c",
      priceFeed: '0x8F460c4F4Fa9F87AeA4f29B4Ee91d1b8e97163BA',
      isStable: true
    },
    // {
    //   name: "USD Coin",
    //   symbol: "USDC",
    //   decimals: 18,
    //   address: "0xFA21223afefF008f63c5fbc20187310f3416fe47",
    //   priceFeed: '0x8F460c4F4Fa9F87AeA4f29B4Ee91d1b8e97163BA',
    //   isStable: true,
    // },
    // {
    //   name: "Tether",
    //   symbol: "USDT",
    //   decimals: 18,
    //   address: "0x2A6aCed1Ae1f8011098fdbA3cA07620E74d19Bb1",
    //   priceFeed: '0x8F460c4F4Fa9F87AeA4f29B4Ee91d1b8e97163BA',
    //   isStable: true,
    // },
  ],
  111: [
    {
      name: "Velas",
      symbol: "VLX",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
    },
    {
      name: "Wrapped Velas",
      symbol: "WVLX",
      decimals: 18,
      address: "0x612777Eea37a44F7a95E3B101C39e1E2695fa6C2",
      isWrapped: true,
      baseSymbol: "VLX",
    },
    {
      name: "Bitcoin (BTCB)",
      symbol: "BTC",
      decimals: 18,
      address: "0xb19C12715134bee7c4b1Ca593ee9E430dABe7b56",
      isShortable: true,
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: "0x1958f7C067226c7C8Ac310Dc994D0cebAbfb2B02",
      isShortable: true,
    },
    {
      name: "USD Gambit",
      symbol: "USDG",
      decimals: 18,
      address: "0x12fE23885BaF83f8eEB5FCa67Ff93Ad2158F3258",
      isUsdg: true,
    },
    {
      name: "Binance USD",
      symbol: "BUSD",
      decimals: 18,
      address: "0x3F223C4E5ac67099CB695834b20cCd5E5D5AA9Ef",
      isStable: true,
      isShortable: true,
    },
  ],
};

const ADDITIONAL_TOKENS = {
  42161: [
    {
      name: "GMX",
      symbol: "GMX",
      address: getContract(42161, "GMX"),
      decimals: 18,
    },
    {
      name: "Escrowed GMX",
      symbol: "esGMX",
      address: getContract(42161, "ES_GMX"),
      decimals: 18,
    },
    {
      name: "GMX LP",
      symbol: "GLP",
      address: getContract(42161, "GLP"),
      decimals: 18,
    },
  ],
  43114: [
    {
      name: "GMX",
      symbol: "GMX",
      address: getContract(43114, "GMX"),
      decimals: 18,
    },
    {
      name: "Escrowed GMX",
      symbol: "esGMX",
      address: getContract(43114, "ES_GMX"),
      decimals: 18,
    },
    {
      name: "GMX LP",
      symbol: "GLP",
      address: getContract(42161, "GLP"),
      decimals: 18,
    },
  ],
};

const CHAIN_IDS = [97, 111];

const TOKENS_MAP = {};
const TOKENS_BY_SYMBOL_MAP = {};

for (let j = 0; j < CHAIN_IDS.length; j++) {
  const chainId = CHAIN_IDS[j];
  TOKENS_MAP[chainId] = {};
  TOKENS_BY_SYMBOL_MAP[chainId] = {};
  let tokens = TOKENS[chainId];
  if (ADDITIONAL_TOKENS[chainId]) {
    tokens = tokens.concat(ADDITIONAL_TOKENS[chainId]);
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    TOKENS_MAP[chainId][token.address] = token;
    TOKENS_BY_SYMBOL_MAP[chainId][token.symbol] = token;
  }
}

const WRAPPED_TOKENS_MAP = {};
const NATIVE_TOKENS_MAP = {};
for (const chainId of CHAIN_IDS) {
  for (const token of TOKENS[chainId]) {
    if (token.isWrapped) {
      WRAPPED_TOKENS_MAP[chainId] = token;
    } else if (token.isNative) {
      NATIVE_TOKENS_MAP[chainId] = token;
    }
  }
}

export function getWrappedToken(chainId) {
  return WRAPPED_TOKENS_MAP[chainId];
}

export function getNativeToken(chainId) {
  return NATIVE_TOKENS_MAP[chainId];
}

export function getTokens(chainId) {
  return TOKENS[chainId];
}

export function isValidToken(chainId, address) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  return address in TOKENS_MAP[chainId];
}

export function getToken(chainId, address) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  if (!TOKENS_MAP[chainId][address]) {
    throw new Error(`Incorrect address "${address}" for chainId ${chainId}`);
  }
  return TOKENS_MAP[chainId][address];
}

export function getTokenBySymbol(chainId, symbol) {
  const token = TOKENS_BY_SYMBOL_MAP[chainId][symbol];
  if (!token) {
    throw new Error(`Incorrect symbol "${symbol}" for chainId ${chainId}`);
  }
  return token;
}

export function getWhitelistedTokens(chainId) {
  return TOKENS[chainId].filter((token) => token.symbol !== "USDG");
}
