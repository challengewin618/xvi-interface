import { ethers } from "ethers";
import { gql } from "@apollo/client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Token as UniToken } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v3-sdk";
import useSWR from "swr";

import OrderBook from "../abis/OrderBook.json";
import PositionManager from "../abis/PositionManager.json";
import Vault from "../abis/Vault.json";
import Router from "../abis/Router.json";
import UniPool from "../abis/UniPool.json";
import Token from "../abis/Token.json";
import VaultReader from "../abis/VaultReader.json";
import PositionRouter from "../abis/PositionRouter.json";

import { getContract } from "../config/Addresses";
import { getConstant } from "../config/chains";
import {
  UI_VERSION,
  // DEFAULT_GAS_LIMIT,
  bigNumberify,
  getExplorerUrl,
  getServerBaseUrl,
  getServerUrl,
  setGasPrice,
  getGasLimit,
  replaceNativeTokenAddress,
  getProvider,
  getOrderKey,
  fetcher,
  parseValue,
  expandDecimals,
  getInfoTokens,
  helperToast,
  getUsd,
  USD_DECIMALS,
  getHighExecutionFee,
  SWAP,
  INCREASE,
  DECREASE,
  BSC_TESTNET, VELAS, VELAS_TESTNET
} from "../lib/legacy";
import { getTokens, getTokenBySymbol, getWhitelistedTokens } from "../config/Tokens";

import {nissohGraphClient, bscTestnetGraphClient} from "./common";
import { groupBy } from "lodash";
export * from "./prices";

const { AddressZero } = ethers.constants;

function getGmxGraphClient(chainId) {
  if (chainId === BSC_TESTNET) {
    return bscTestnetGraphClient;
  }
  throw new Error(`Unsupported chain ${chainId}`);
}

export function useAllOrdersStats(chainId) {
  const query = gql(`{
    orderStat(id: "total") {
      openSwap
      openIncrease
      openDecrease
      executedSwap
      executedIncrease
      executedDecrease
      cancelledSwap
      cancelledIncrease
      cancelledDecrease
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    const graphClient = getGmxGraphClient(chainId);
    if (graphClient) {
      graphClient.query({ query }).then(setRes).catch(console.warn);
    }
  }, [setRes, query, chainId]);

  return res ? res.data.orderStat : null;
}

export function useTokenPrices(chainId) {
  const tokenPricesUrl = getServerUrl(chainId, "/prices/" + chainId);
  const { data: tokenPrices } = useSWR([tokenPricesUrl], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
    refreshInterval: 60000,
    refreshWhenHidden: true,
  });

  return tokenPrices;
}

export function useInfoTokens(library, chainId, active, tokenBalances, fundingRateInfo, vaultPropsLength) {
  const tokens = getTokens(chainId);
  const vaultReaderAddress = getContract(chainId, "VaultReader");
  const vaultAddress = getContract(chainId, "Vault");
  const positionRouterAddress = getContract(chainId, "PositionRouter");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);

  const { data: vaultTokenInfo } = useSWR(
    [`useInfoTokens:${active}`, chainId, vaultReaderAddress, "getVaultTokenInfoV4"],
    {
      fetcher: fetcher(library, VaultReader, [
        vaultAddress,
        positionRouterAddress,
        nativeTokenAddress,
        expandDecimals(1, 18),
        whitelistedTokenAddresses,
      ]),
    }
  );

  const indexPricesUrl = getServerUrl(chainId, "/prices/" + chainId);
  const { data: indexPrices } = useSWR([indexPricesUrl], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
    refreshInterval: 60000,
    refreshWhenHidden: true,
  });

  return {
    infoTokens: getInfoTokens(
      tokens,
      tokenBalances,
      whitelistedTokens,
      vaultTokenInfo,
      fundingRateInfo,
      vaultPropsLength,
      indexPrices,
      nativeTokenAddress
    ),
  };
}

export function useTotalData() {
  const url = getServerUrl(BSC_TESTNET, "/total_data");

  const {data: totalData} = useSWR(url, async () => {
    const response = await fetch(url);
    return await response.json();
  })

  return {
    totalTradingVolume: totalData ? totalData.totalTradingVolume : 0,
    openInterest: totalData ? totalData.openInterest : 0,
    totalUsers: totalData ? totalData.totalUsers : 0
  };
}

export function useLiquidationsData(chainId, account) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (account) {
      const query = gql(`{
         liquidatedPositions(
           where: {account: "${account.toLowerCase()}"}
           first: 100
           orderBy: timestamp
           orderDirection: desc
         ) {
           key
           timestamp
           borrowFee
           loss
           collateral
           size
           markPrice
           type
         }
      }`);
      const graphClient = getGmxGraphClient(chainId);
      if (!graphClient) {
        return;
      }

      graphClient
        .query({ query })
        .then((res) => {
          const _data = res.data.liquidatedPositions.map((item) => {
            return {
              ...item,
              size: bigNumberify(item.size),
              collateral: bigNumberify(item.collateral),
              markPrice: bigNumberify(item.markPrice),
            };
          });
          setData(_data);
        })
        .catch(console.warn);
    }
  }, [setData, chainId, account]);

  return data;
}

export function useAllPositions(chainId, library) {
  const count = 1000;
  const query = gql(`{
    aggregatedTradeOpens(
      first: ${count}
    ) {
      account
      initialPosition{
        indexToken
        collateralToken
        isLong
        sizeDelta
      }
      increaseList {
        sizeDelta
      }
      decreaseList {
        sizeDelta
      }
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    nissohGraphClient.query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query]);

  const key = res ? `allPositions${count}__` : false;
  const { data: positions = [] } = useSWR(key, async () => {
    const provider = getProvider(library, chainId);
    const vaultAddress = getContract(chainId, "Vault");
    const contract = new ethers.Contract(vaultAddress, Vault.abi, provider);
    const ret = await Promise.all(
      res.data.aggregatedTradeOpens.map(async (dataItem) => {
        try {
          const { indexToken, collateralToken, isLong } = dataItem.initialPosition;
          const positionData = await contract.getPosition(dataItem.account, collateralToken, indexToken, isLong);
          const position = {
            size: bigNumberify(positionData[0]),
            collateral: bigNumberify(positionData[1]),
            entryFundingRate: bigNumberify(positionData[3]),
            account: dataItem.account,
          };
          position.fundingFee = await contract.getFundingFee(collateralToken, position.size, position.entryFundingRate);
          position.marginFee = position.size.div(1000);
          position.fee = position.fundingFee.add(position.marginFee);

          const THRESHOLD = 5000;
          const collateralDiffPercent = position.fee.mul(10000).div(position.collateral);
          position.danger = collateralDiffPercent.gt(THRESHOLD);

          return position;
        } catch (ex) {
          console.error(ex);
        }
      })
    );

    return ret.filter(Boolean);
  });

  return positions;
}

export function useAllOrders(chainId, library) {
  const query = gql(`{
    orders(
      first: 1000,
      orderBy: createdTimestamp,
      orderDirection: desc,
      where: {status: "open"}
    ) {
      type
      account
      index
      status
      createdTimestamp
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    getGmxGraphClient(chainId).query({ query }).then(setRes);
  }, [setRes, query, chainId]);

  const key = res ? res.data.orders.map((order) => `${order.type}-${order.account}-${order.index}`) : null;
  const { data: orders = [] } = useSWR(key, () => {
    const provider = getProvider(library, chainId);
    const orderBookAddress = getContract(chainId, "OrderBook");
    const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, provider);
    return Promise.all(
      res.data.orders.map(async (order) => {
        try {
          const type = order.type.charAt(0).toUpperCase() + order.type.substring(1);
          const method = `get${type}Order`;
          const orderFromChain = await contract[method](order.account, order.index);
          const ret = {};
          for (const [key, val] of Object.entries(orderFromChain)) {
            ret[key] = val;
          }
          if (order.type === "swap") {
            ret.path = [ret.path0, ret.path1, ret.path2].filter((address) => address !== AddressZero);
          }
          ret.type = type;
          ret.index = order.index;
          ret.account = order.account;
          ret.createdTimestamp = order.createdTimestamp;
          return ret;
        } catch (ex) {
          console.error(ex);
        }
      })
    );
  });

  return orders.filter(Boolean);
}

export function usePositionsForOrders(chainId, library, orders) {
  const key = orders ? orders.map((order) => getOrderKey(order) + "____") : null;
  const { data: positions = {} } = useSWR(key, async () => {
    const provider = getProvider(library, chainId);
    const vaultAddress = getContract(chainId, "Vault");
    const contract = new ethers.Contract(vaultAddress, Vault.abi, provider);
    const data = await Promise.all(
      orders.map(async (order) => {
        try {
          const position = await contract.getPosition(
            order.account,
            order.collateralToken,
            order.indexToken,
            order.isLong
          );
          if (position[0].eq(0)) {
            return [null, order];
          }
          return [position, order];
        } catch (ex) {
          console.error(ex);
        }
      })
    );
    return data.reduce((memo, [position, order]) => {
      memo[getOrderKey(order)] = position;
      return memo;
    }, {});
  });

  return positions;
}

function invariant(condition, errorMsg) {
  if (!condition) {
    throw new Error(errorMsg);
  }
}

export function useTrades(chainId, account, forSingleAccount, afterId) {
  let url =
    account && account.length > 0
      ? `${getServerBaseUrl(chainId)}/actions?account=${account}`
      : !forSingleAccount && `${getServerBaseUrl(chainId)}/actions`;

  if (afterId && afterId.length > 0) {
    const urlItem = new URL(url);
    urlItem.searchParams.append("after", afterId);
    url = urlItem.toString();
  }

  const { data: trades, mutate: updateTrades } = useSWR(url && url, {
    dedupingInterval: 10000,
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  if (trades) {
    trades.sort((item0, item1) => {
      const data0 = item0.data;
      const data1 = item1.data;
      const time0 = parseInt(data0.timestamp);
      const time1 = parseInt(data1.timestamp);
      if (time1 > time0) {
        return 1;
      }
      if (time1 < time0) {
        return -1;
      }

      const block0 = parseInt(data0.blockNumber);
      const block1 = parseInt(data1.blockNumber);

      if (isNaN(block0) && isNaN(block1)) {
        return 0;
      }

      if (isNaN(block0)) {
        return 1;
      }

      if (isNaN(block1)) {
        return -1;
      }

      if (block1 > block0) {
        return 1;
      }

      if (block1 < block0) {
        return -1;
      }

      return 0;
    });
  }

  return { trades, updateTrades };
}

export function useMinExecutionFee(library, active, chainId, infoTokens) {
  const positionRouterAddress = getContract(chainId, "PositionRouter");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");

  const { data: minExecutionFee } = useSWR([active, chainId, positionRouterAddress, "minExecutionFee"], {
    fetcher: fetcher(library, PositionRouter),
  });

  const { data: gasPrice } = useSWR(["gasPrice", chainId], {
    fetcher: () => {
      return new Promise(async (resolve, reject) => {
        const provider = getProvider(library, chainId);
        if (!provider) {
          resolve(undefined);
          return;
        }

        try {
          const gasPrice = await provider.getGasPrice();
          resolve(gasPrice);
        } catch (e) {
          console.error(e);
        }
      });
    },
  });

  let multiplier;

  // if gas prices on Binance are high, the main transaction costs would come from the L2 gas usage
  // for executing positions this is around 65,000 gas
  // if gas prices on Ethereum are high, than the gas usage might be higher, this calculation doesn't deal with that
  // case yet
  if (chainId === BSC_TESTNET) {
    multiplier = 700000;
  } else if (chainId === VELAS_TESTNET) {
    multiplier = 700000;
  }

  let finalExecutionFee = minExecutionFee;

  if (gasPrice && minExecutionFee) {
    const estimatedExecutionFee = gasPrice.mul(multiplier);
    if (estimatedExecutionFee.gt(minExecutionFee)) {
      finalExecutionFee = estimatedExecutionFee;
    }
  }

  const finalExecutionFeeUSD = getUsd(finalExecutionFee, nativeTokenAddress, false, infoTokens);
  const isFeeHigh = finalExecutionFeeUSD?.gt(expandDecimals(getHighExecutionFee(chainId), USD_DECIMALS));
  const errorMessage =
    isFeeHigh &&
    `The network cost to send transactions is high at the moment, please check the "Execution Fee" value before proceeding.`;

  return {
    minExecutionFee: finalExecutionFee,
    minExecutionFeeUSD: finalExecutionFeeUSD,
    minExecutionFeeErrorMessage: errorMessage,
  };
}

export function useHasOutdatedUi() {
  const url = getServerUrl(BSC_TESTNET, "/ui_version");
  const { data, mutate } = useSWR([url], {
    fetcher: (...args) => fetch(...args).then((res) => res.text()),
  });

  let hasOutdatedUi = false;

  if (data && parseFloat(data) > parseFloat(UI_VERSION)) {
    hasOutdatedUi = true;
  }

  return { data: hasOutdatedUi, mutate };
}

export function useLeveragePrice(chainId, libraries, active) {
  const poolAddress = getContract(chainId, chainId === BSC_TESTNET ? "LeverageBnbPool" : "LeverageVelasPool");
  const { data: uniPoolSlot0, mutate: updateUniPoolSlot0 } = useSWR(
    [`StakeV2:uniPoolSlot0:${active}`, chainId, poolAddress, "slot0"],
    {
      fetcher: fetcher(libraries, UniPool),
    }
  );

  const vaultAddress = getContract(chainId, "Vault");
  const nativeTokenAddress = getTokenBySymbol(chainId, getConstant(chainId, "wrappedTokenSymbol")).address;
  const { data: nativeTokenPrice, mutate: updateNativeTokenPrice } = useSWR(
    [`StakeV2:ethPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
    {
      fetcher: fetcher(libraries, Vault),
    }
  );

  const leveragePrice = useMemo(() => {
    if (uniPoolSlot0 && nativeTokenPrice) {
      const leverageAddress = getContract(BSC_TESTNET, "Leverage");
      const tokenA = new UniToken(BSC_TESTNET, nativeTokenAddress, 18, "SYMBOL", "NAME");
      const tokenB = new UniToken(BSC_TESTNET, leverageAddress, 18, "SYMBOL", "NAME");

      const pool = new Pool(
        tokenA, // tokenA
        tokenB, // tokenB
        10000, // fee
        uniPoolSlot0.sqrtPriceX96, // sqrtRatioX96
        1, // liquidity
        uniPoolSlot0.tick, // tickCurrent
        []
      );

      const poolTokenPrice = pool.priceOf(tokenB).toSignificant(6);
      const poolTokenPriceAmount = parseValue(poolTokenPrice, 18);
      return poolTokenPriceAmount.mul(nativeTokenPrice).div(expandDecimals(1, 18));
    }
  }, [nativeTokenPrice, uniPoolSlot0, nativeTokenAddress]);

  const mutate = useCallback(() => {
    updateUniPoolSlot0(undefined, true);
    updateNativeTokenPrice(undefined, true);
  }, [updateNativeTokenPrice, updateUniPoolSlot0]);

  return { data: leveragePrice, mutate };
}

export function useTotalGmxStaked() {
  const stakedGmxTrackerAddress = getContract(BSC_TESTNET, "StakedLeverageTracker");
  let totalStakedGmx = useRef(bigNumberify(0));
  const { data: stakedGmxSupply, mutate: updateStakedGmxSupply } = useSWR(
    [
      `StakeV2:stakedGmxSupply:${BSC_TESTNET}`,
      BSC_TESTNET,
      getContract(BSC_TESTNET, "Leverage"),
      "balanceOf",
      stakedGmxTrackerAddress,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const mutate = useCallback(() => {
    updateStakedGmxSupply();
  }, [updateStakedGmxSupply]);

  if (stakedGmxSupply) {
    let total = bigNumberify(stakedGmxSupply);
    totalStakedGmx.current = total;
  }

  return {
    bsc: stakedGmxSupply,
    total: totalStakedGmx.current,
    mutate,
  };
}

// export function useTotalGmxInLiquidity() {
//   let poolAddressArbitrum = getContract(ARBITRUM, "UniswapGmxEthPool");
//   let poolAddressAvax = getContract(AVALANCHE, "TraderJoeGmxAvaxPool");
//   let totalGMX = useRef(bigNumberify(0));
//
//   const { data: gmxInLiquidityOnArbitrum, mutate: mutateGMXInLiquidityOnArbitrum } = useSWR(
//     [`StakeV2:gmxInLiquidity:${ARBITRUM}`, ARBITRUM, getContract(ARBITRUM, "GMX"), "balanceOf", poolAddressArbitrum],
//     {
//       fetcher: fetcher(undefined, Token),
//     }
//   );
//   const { data: gmxInLiquidityOnAvax, mutate: mutateGMXInLiquidityOnAvax } = useSWR(
//     [`StakeV2:gmxInLiquidity:${AVALANCHE}`, AVALANCHE, getContract(AVALANCHE, "GMX"), "balanceOf", poolAddressAvax],
//     {
//       fetcher: fetcher(undefined, Token),
//     }
//   );
//   const mutate = useCallback(() => {
//     mutateGMXInLiquidityOnArbitrum();
//     mutateGMXInLiquidityOnAvax();
//   }, [mutateGMXInLiquidityOnArbitrum, mutateGMXInLiquidityOnAvax]);
//
//   if (gmxInLiquidityOnAvax && gmxInLiquidityOnArbitrum) {
//     let total = bigNumberify(gmxInLiquidityOnArbitrum).add(gmxInLiquidityOnAvax);
//     totalGMX.current = total;
//   }
//   return {
//     avax: gmxInLiquidityOnAvax,
//     arbitrum: gmxInLiquidityOnArbitrum,
//     total: totalGMX.current,
//     mutate,
//   };
// }

export async function approvePlugin(
  chainId,
  pluginAddress,
  { library, pendingTxns, setPendingTxns, sentMsg, failMsg }
) {
  const routerAddress = getContract(chainId, "Router");
  const contract = new ethers.Contract(routerAddress, Router.abi, library.getSigner());
  return callContract(chainId, contract, "approvePlugin", [pluginAddress], {
    sentMsg,
    failMsg,
    pendingTxns,
    setPendingTxns,
  });
}

export async function createSwapOrder(
  chainId,
  library,
  path,
  amountIn,
  minOut,
  triggerRatio,
  nativeTokenAddress,
  opts = {}
) {
  const executionFee = getConstant(chainId, "SWAP_ORDER_EXECUTION_GAS_FEE");
  const triggerAboveThreshold = false;
  let shouldWrap = false;
  let shouldUnwrap = false;
  opts.value = executionFee;

  if (path[0] === AddressZero) {
    shouldWrap = true;
    opts.value = opts.value.add(amountIn);
  }
  if (path[path.length - 1] === AddressZero) {
    shouldUnwrap = true;
  }
  path = replaceNativeTokenAddress(path, nativeTokenAddress);

  const params = [path, amountIn, minOut, triggerRatio, triggerAboveThreshold, executionFee, shouldWrap, shouldUnwrap];

  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, "createSwapOrder", params, opts);
}

export async function createIncreaseOrder(
  chainId,
  library,
  nativeTokenAddress,
  path,
  amountIn,
  indexTokenAddress,
  minOut,
  sizeDelta,
  collateralTokenAddress,
  isLong,
  triggerPrice,
  opts = {}
) {
  invariant(!isLong || indexTokenAddress === collateralTokenAddress, "invalid token addresses");
  invariant(indexTokenAddress !== AddressZero, "indexToken is 0");
  invariant(collateralTokenAddress !== AddressZero, "collateralToken is 0");

  const fromETH = path[0] === AddressZero;

  path = replaceNativeTokenAddress(path, nativeTokenAddress);
  const shouldWrap = fromETH;
  const triggerAboveThreshold = !isLong;
  const executionFee = getConstant(chainId, "INCREASE_ORDER_EXECUTION_GAS_FEE");

  const params = [
    path,
    amountIn,
    indexTokenAddress,
    minOut,
    sizeDelta,
    collateralTokenAddress,
    isLong,
    triggerPrice,
    triggerAboveThreshold,
    executionFee,
    shouldWrap,
  ];

  if (!opts.value) {
    opts.value = fromETH ? amountIn.add(executionFee) : executionFee;
  }

  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, "createIncreaseOrder", params, opts);
}

export async function createDecreaseOrder(
  chainId,
  library,
  indexTokenAddress,
  sizeDelta,
  collateralTokenAddress,
  collateralDelta,
  isLong,
  triggerPrice,
  triggerAboveThreshold,
  opts = {}
) {
  invariant(!isLong || indexTokenAddress === collateralTokenAddress, "invalid token addresses");
  invariant(indexTokenAddress !== AddressZero, "indexToken is 0");
  invariant(collateralTokenAddress !== AddressZero, "collateralToken is 0");

  const executionFee = getConstant(chainId, "DECREASE_ORDER_EXECUTION_GAS_FEE");

  const params = [
    indexTokenAddress,
    sizeDelta,
    collateralTokenAddress,
    collateralDelta,
    isLong,
    triggerPrice,
    triggerAboveThreshold,
  ];
  opts.value = executionFee;
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, "createDecreaseOrder", params, opts);
}

export async function cancelSwapOrder(chainId, library, index, opts) {
  const params = [index];
  const method = "cancelSwapOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function cancelDecreaseOrder(chainId, library, index, opts) {
  const params = [index];
  const method = "cancelDecreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function cancelIncreaseOrder(chainId, library, index, opts) {
  const params = [index];
  const method = "cancelIncreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export function handleCancelOrder(chainId, library, order, opts) {
  let func;
  if (order.type === SWAP) {
    func = cancelSwapOrder;
  } else if (order.type === INCREASE) {
    func = cancelIncreaseOrder;
  } else if (order.type === DECREASE) {
    func = cancelDecreaseOrder;
  }

  return func(chainId, library, order.index, {
    successMsg: "Order cancelled.",
    failMsg: "Cancel failed.",
    sentMsg: "Cancel submitted.",
    pendingTxns: opts.pendingTxns,
    setPendingTxns: opts.setPendingTxns,
  });
}

export async function cancelMultipleOrders(chainId, library, allIndexes = [], opts) {
  const ordersWithTypes = groupBy(allIndexes, (v) => v.split("-")[0]);
  function getIndexes(key) {
    if (!ordersWithTypes[key]) return;
    return ordersWithTypes[key].map((d) => d.split("-")[1]);
  }
  // params order => swap, increase, decrease
  const params = ["Swap", "Increase", "Decrease"].map((key) => getIndexes(key) || []);
  const method = "cancelMultiple";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());
  return callContract(chainId, contract, method, params, opts);
}

export async function updateDecreaseOrder(
  chainId,
  library,
  index,
  collateralDelta,
  sizeDelta,
  triggerPrice,
  triggerAboveThreshold,
  opts
) {
  const params = [index, collateralDelta, sizeDelta, triggerPrice, triggerAboveThreshold];
  const method = "updateDecreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateIncreaseOrder(
  chainId,
  library,
  index,
  sizeDelta,
  triggerPrice,
  triggerAboveThreshold,
  opts
) {
  const params = [index, sizeDelta, triggerPrice, triggerAboveThreshold];
  const method = "updateIncreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateSwapOrder(chainId, library, index, minOut, triggerRatio, triggerAboveThreshold, opts) {
  const params = [index, minOut, triggerRatio, triggerAboveThreshold];
  const method = "updateSwapOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function _executeOrder(chainId, library, method, account, index, feeReceiver, opts) {
  const params = [account, index, feeReceiver];
  const positionManagerAddress = getContract(chainId, "PositionManager");
  const contract = new ethers.Contract(positionManagerAddress, PositionManager.abi, library.getSigner());
  return callContract(chainId, contract, method, params, opts);
}

export function executeSwapOrder(chainId, library, account, index, feeReceiver, opts) {
  return _executeOrder(chainId, library, "executeSwapOrder", account, index, feeReceiver, opts);
}

export function executeIncreaseOrder(chainId, library, account, index, feeReceiver, opts) {
  return _executeOrder(chainId, library, "executeIncreaseOrder", account, index, feeReceiver, opts);
}

export function executeDecreaseOrder(chainId, library, account, index, feeReceiver, opts) {
  return _executeOrder(chainId, library, "executeDecreaseOrder", account, index, feeReceiver, opts);
}

const NOT_ENOUGH_FUNDS = "NOT_ENOUGH_FUNDS";
const USER_DENIED = "USER_DENIED";
const SLIPPAGE = "SLIPPAGE";
const RPC_ERROR = "RPC_ERROR";

const TX_ERROR_PATTERNS = {
  [NOT_ENOUGH_FUNDS]: [
    { msg: "not enough funds for gas" },
    { msg: "failed to execute call with revert code InsufficientGasFunds" },
  ],
  [USER_DENIED]: [{ msg: "User denied transaction signature" }],
  [SLIPPAGE]: [{ msg: "Router: mark price lower than limit" }, { msg: "Router: mark price higher than limit" }],
  [RPC_ERROR]: [
    // @see https://eips.ethereum.org/EIPS/eip-1474#error-codes
    { code: -32005 },
    { msg: "Non-200 status code" },
    { msg: "Request limit exceeded" },
    { msg: "Internal JSON-RPC error" },
    { msg: "Response has no error or result" },
    { msg: "couldn't connect to the network" },
  ],
};

export function extractError(ex) {
  if (!ex) {
    return [];
  }

  const message = ex.data?.message || ex.message;
  const code = ex.code;

  if (!message && !code) {
    return [];
  }

  for (const [type, patterns] of Object.entries(TX_ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      const matchCode = pattern.code && code === pattern.code;
      const matchMessage = pattern.msg && message && message.includes(pattern.msg);

      if (matchCode || matchMessage) {
        return [message, type, ex.data];
      }
    }
  }

  return [message, null, ex.data];
}

function ToastifyDebug(props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="Toastify-debug">
      <span className="Toastify-debug-button" onClick={() => setOpen((old) => !old)}>
        {open ? "Hide error" : "Show error"}
      </span>
      {open && <div className="Toastify-debug-content">{props.children}</div>}
    </div>
  );
}

export async function callContract(chainId, contract, method, params, opts) {
  try {
    if (!Array.isArray(params) && typeof params === "object" && opts === undefined) {
      opts = params;
      params = [];
    }
    if (!opts) {
      opts = {};
    }

    const txnOpts = {};

    if (opts.value) {
      txnOpts.value = opts.value;
    }

    txnOpts.gasLimit = opts.gasLimit ? opts.gasLimit : await getGasLimit(contract, method, params, opts.value);

    await setGasPrice(txnOpts, contract.provider, chainId);

    const res = await contract[method](...params, txnOpts);
    const txUrl = getExplorerUrl(chainId) + "tx/" + res.hash;
    const sentMsg = opts.sentMsg || "Transaction sent.";
    helperToast.success(
      <div>
        {sentMsg}{" "}
        <a href={txUrl} target="_blank" rel="noopener noreferrer">
          View status.
        </a>
        <br />
      </div>
    );
    if (opts.setPendingTxns) {
      const message = opts.hideSuccessMsg ? undefined : opts.successMsg || "Transaction completed!";
      const pendingTxn = {
        hash: res.hash,
        message,
      };
      opts.setPendingTxns((pendingTxns) => [...pendingTxns, pendingTxn]);
    }
    return res;
  } catch (e) {
    let failMsg;
    let autoCloseToast = 5000;

    const [message, type, errorData] = extractError(e);
    switch (type) {
      case NOT_ENOUGH_FUNDS:
        failMsg = (
          <div>
            There is not enough BNB in your account on Binance to send this transaction.
            <br />
            <br />
            <a href={"https://bscscan.com/bridge-tutorial/"} target="_blank" rel="noopener noreferrer">
              Bridge BNB to Binance
            </a>
          </div>
        );
        break;
      case USER_DENIED:
        failMsg = "Transaction was cancelled.";
        break;
      case SLIPPAGE:
        failMsg =
          'The mark price has changed, consider increasing your Allowed Slippage by clicking on the "..." icon next to your address.';
        break;
      case RPC_ERROR:
        autoCloseToast = false;

        const originalError = errorData?.error?.message || errorData?.message || message;

        failMsg = (
          <div>
            Transaction failed due to RPC error.
            <br />
            <br />
            Please try changing the RPC url in your wallet settings.{" "}
            <a href="https://gmxio.gitbook.io/gmx/trading#backup-rpc-urls" target="_blank" rel="noopener noreferrer">
              More info
            </a>
            <br />
            {originalError && <ToastifyDebug>{originalError}</ToastifyDebug>}
          </div>
        );
        break;
      default:
        autoCloseToast = false;

        failMsg = (
          <div>
            {opts.failMsg || "Transaction failed"}
            <br />
            {message && <ToastifyDebug>{message}</ToastifyDebug>}
          </div>
        );
    }
    helperToast.error(failMsg, { autoClose: autoCloseToast });
    throw e;
  }
}
