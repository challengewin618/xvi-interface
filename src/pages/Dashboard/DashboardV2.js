import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import { t, Trans } from "@lingui/macro";
import useSWR from "swr";
import { Cell, Pie, PieChart, Tooltip, ResponsiveContainer } from "recharts";
import TooltipComponent from "../../components/Tooltip/Tooltip";

import hexToRgba from "hex-to-rgba";
import { ethers } from "ethers";

import { getWhitelistedTokens } from "../../config/Tokens";
import { getFeeHistory } from "../../config/Fees";

import {
  arrayURLFetcher,
  BASIS_POINTS_DIVISOR,
  bigNumberify,
  BSC_TESTNET,
  DEFAULT_MAX_USDG_AMOUNT,
  expandDecimals,
  fetcher,
  formatAmount,
  formatArrayAmount,
  formatDate,
  formatKeyAmount,
  getChainName,
  getPageTitle,
  getServerUrl,
  GLP_DECIMALS,
  GLPPOOLCOLORS,
  LEVERAGE_DECIMALS,
  importImage,
  numberWithCommas,
  USD_DECIMALS,
  useChainId,
  VELAS_TESTNET,
} from "../../lib/legacy";
import { useInfoTokens, useLeveragePrice } from "../../domain/legacy";

import { getContract } from "../../config/Addresses";

import VaultV2 from "../../abis/Vault.json";
import ReaderV2 from "../../abis/Reader.json";
import GlpManager from "../../abis/GlpManager.json";
import Token from "../../abis/Token.json";
import Footer from "../../components/Footer/Footer";

import "./DashboardV2.css";

import gmx40Icon from "../../img/ic_gmx_40.svg";
import glp40Icon from "../../img/ic_glp_40.svg";
import bsc16Icon from "../../img/ic_bsc_16.svg";
import bsc24Icon from "../../img/ic_bsc_16.svg";
import bsc52Icon from "../../img/ic_bsc_52.svg";

import velas16Icon from "../../img/ic_velas_16.svg";
import velas24Icon from "../../img/ic_velas_24.svg";
import SEO from "../../components/Common/SEO";
import TooltipCard, { TooltipCardRow } from "./TooltipCard";
import useTotalVolume from "../../domain/useTotalVolume";
import AssetDropdown from "./AssetDropdown";
import binanceIcon from "../../img/ic_bsc_52.svg";
import spiderIcon from "../../img/spider_icon.png";
import velasIcon from "../../img/velas_blue.png";

const ACTIVE_CHAIN_IDS = [BSC_TESTNET, VELAS_TESTNET];

const { AddressZero } = ethers.constants;

function getVolumeInfo(hourlyVolumes) {
  if (!hourlyVolumes || hourlyVolumes.length === 0) {
    return {};
  }
  let dailyVolumes = hourlyVolumes.map((hourlyVolume) => {
    const secondsPerHour = 60 * 60;
    const minTime = parseInt(Date.now() / 1000 / secondsPerHour) * secondsPerHour - 24 * secondsPerHour;
    const info = {};
    let totalVolume = bigNumberify(0);
    for (let i = 0; i < hourlyVolume.length; i++) {
      const item = hourlyVolume[i].data;
      if (parseInt(item.timestamp) < minTime) {
        break;
      }

      if (!info[item.token]) {
        info[item.token] = bigNumberify(0);
      }

      info[item.token] = info[item.token].add(item.volume);
      totalVolume = totalVolume.add(item.volume);
    }
    info.totalVolume = totalVolume;
    return info;
  });
  if (!dailyVolumes || dailyVolumes.length == 0) {
    return {};
  }
  if (!dailyVolumes.length) {
    dailyVolumes = [dailyVolumes];
  }
  return dailyVolumes.reduce(
    (acc, cv, index) => {
      acc.totalVolume = acc.totalVolume.add(cv.totalVolume);
      acc[ACTIVE_CHAIN_IDS[index]] = cv;
      return acc;
    },
    { totalVolume: bigNumberify(0) }
  );
}

function getPositionStats(positionStats) {
  if (!positionStats || positionStats.length === 0) {
    return null;
  }
  if (!positionStats.length) {
    positionStats = [positionStats];
  }
  return positionStats.reduce(
    (acc, cv, i) => {
      acc.totalLongPositionSizes = acc.totalLongPositionSizes.add(cv.totalLongPositionSizes);
      acc.totalShortPositionSizes = acc.totalShortPositionSizes.add(cv.totalShortPositionSizes);
      acc[ACTIVE_CHAIN_IDS[i]] = cv;
      return acc;
    },
    {
      totalLongPositionSizes: bigNumberify(0),
      totalShortPositionSizes: bigNumberify(0),
    }
  );
}

function getCurrentFeesUsd(tokenAddresses, fees, infoTokens) {
  if (!fees || !infoTokens) {
    return bigNumberify(0);
  }

  let currentFeesUsd = bigNumberify(0);
  for (let i = 0; i < tokenAddresses.length; i++) {
    const tokenAddress = tokenAddresses[i];
    const tokenInfo = infoTokens[tokenAddress];
    if (!tokenInfo || !tokenInfo.contractMinPrice) {
      continue;
    }

    const feeUsd = fees[i].mul(tokenInfo.contractMinPrice).div(expandDecimals(1, tokenInfo.decimals));
    currentFeesUsd = currentFeesUsd.add(feeUsd);
  }

  return currentFeesUsd;
}

export default function DashboardV2() {
  const { active, library } = useWeb3React();
  const { chainId } = useChainId();
  const totalVolume = useTotalVolume();

  const chainName = getChainName(chainId);

  const { data: positionStats, mutate: updatePositionStats } = useSWR(
    ACTIVE_CHAIN_IDS.map((chainId) => getServerUrl(chainId, "/position_stats")),
    {
      fetcher: arrayURLFetcher,
    }
  );

  const { data: hourlyVolumes, mutate: updateHourlyVolumes } = useSWR(
    ACTIVE_CHAIN_IDS.map((chainId) => getServerUrl(chainId, "/hourly_volume")),
    {
      fetcher: arrayURLFetcher,
    }
  );

  const currentVolumeInfo = getVolumeInfo(hourlyVolumes);

  const positionStatsInfo = getPositionStats(positionStats);

  function getWhitelistedTokenAddresses(chainId) {
    const whitelistedTokens = getWhitelistedTokens(chainId);
    return whitelistedTokens.map((token) => token.address);
  }

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);
  const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);
  const visibleTokens = tokenList.filter((t) => !t.isTempHidden);

  const readerAddress = getContract(chainId, "Reader");
  const vaultAddress = getContract(chainId, "Vault");
  const glpManagerAddress = getContract(chainId, "GlpManager");

  const leverageAddress = getContract(chainId, "Leverage");
  const glpAddress = getContract(chainId, "GLP");
  const usdgAddress = getContract(chainId, "USDG");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");

  const tokensForSupplyQuery = [leverageAddress, glpAddress, usdgAddress];

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  const { data: aums, mutate: updateAums } = useSWR(
    [`Dashboard:getAums:${active}`, chainId, glpManagerAddress, "getAums"],
    {
      fetcher: fetcher(library, GlpManager),
    }
  );

  const { data: fees, mutate: updateFees } = useSWR(
    [`Dashboard:fees1:${active}`, chainId, readerAddress, "getFees", vaultAddress],
    {
      fetcher: fetcher(library, ReaderV2, [whitelistedTokenAddresses]),
    }
  );

  const { data: totalSupplies, mutate: updateTotalSupplies } = useSWR(
    [`Dashboard:totalSupplies:${active}`, chainId, readerAddress, "getTokenBalancesWithSupplies", AddressZero],
    {
      fetcher: fetcher(library, ReaderV2, [tokensForSupplyQuery]),
    }
  );

  const { data: totalTokenWeights, mutate: updateTotalTokenWeights } = useSWR(
    [`GlpSwap:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
    {
      fetcher: fetcher(library, VaultV2),
    }
  );

  const nativeToken = infoTokens[nativeTokenAddress];
  const currentFeesUsd = getCurrentFeesUsd(whitelistedTokenAddresses, fees, infoTokens);

  const { data: currentFees } = useSWR(infoTokens[AddressZero].contractMinPrice ? "Dashboard:currentFees" : null, {
    fetcher: () => {
      return Promise.all(
        ACTIVE_CHAIN_IDS.map((chainId) =>
          fetcher(null, ReaderV2, [getWhitelistedTokenAddresses(chainId)])(
            `Dashboard:fees2:${chainId}`,
            chainId,
            getContract(chainId, "Reader"),
            "getFees",
            getContract(chainId, "Vault")
          )
        )
      ).then((fees) => {
        return fees.reduce(
          (acc, cv, i) => {
            const feeUSD = getCurrentFeesUsd(getWhitelistedTokenAddresses(ACTIVE_CHAIN_IDS[i]), cv, infoTokens);
            acc[ACTIVE_CHAIN_IDS[i]] = feeUSD;
            acc.total = acc.total.add(feeUSD);
            return acc;
          },
          { total: bigNumberify(0) }
        );
      });
    },
  });

  const feeHistory = getFeeHistory(chainId);
  const shouldIncludeCurrrentFees = feeHistory.length && parseInt(Date.now() / 1000) - feeHistory[0].to > 60 * 60;
  let totalFeesDistributed = shouldIncludeCurrrentFees
    ? parseFloat(bigNumberify(formatAmount(currentFeesUsd, USD_DECIMALS - 2, 0, false)).toNumber()) / 100
    : 0;

  const totalFees = ACTIVE_CHAIN_IDS.map((chainId) =>
    getFeeHistory(chainId).reduce((acc, fee) => acc + parseFloat(fee.feeUsd), totalFeesDistributed)
  )
    .map((v) => Math.round(v))
    .reduce(
      (acc, cv, i) => {
        acc[ACTIVE_CHAIN_IDS[i]] = cv;
        acc.total = acc.total + cv;
        return acc;
      },
      { total: 0 }
    );

  const stakedLeverageTrackerAddress = getContract(chainId, "StakedLeverageTracker");

  const { data: stakedLeverageSupply, mutate: updateStakedGmxSupply } = useSWR(
    ["Dashboard:stakedLeverageSupply", chainId, leverageAddress, "balanceOf", stakedLeverageTrackerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const { data: leveragePrice, mutate: updateLeveragePrice } = useLeveragePrice(chainId, library, active);

  let leverageMarketCap;
  if (leveragePrice && totalSupplies && totalSupplies[1]) {
    leverageMarketCap = leveragePrice.mul(totalSupplies[1]).div(expandDecimals(1, LEVERAGE_DECIMALS));
  }

  let stakedLeverageSupplyUsd;
  if (leveragePrice && stakedLeverageSupply) {
    stakedLeverageSupplyUsd = stakedLeverageSupply.mul(leveragePrice).div(expandDecimals(1, LEVERAGE_DECIMALS));
  }

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  let tvl;
  if (aum && leveragePrice && stakedLeverageSupply) {
    tvl = aum.add(leveragePrice.mul(stakedLeverageSupply).div(expandDecimals(1, LEVERAGE_DECIMALS)));
  }

  let glpPrice;
  let glpSupply;
  let glpMarketCap;
  if (aum && totalSupplies && totalSupplies[3]) {
    glpSupply = totalSupplies[3];
    glpPrice =
      aum && aum.gt(0) && glpSupply.gt(0)
        ? aum.mul(expandDecimals(1, GLP_DECIMALS)).div(glpSupply)
        : expandDecimals(1, USD_DECIMALS);
    glpMarketCap = glpPrice.mul(glpSupply).div(expandDecimals(1, GLP_DECIMALS));
  }

  const nativeTokenFloorPriceFund = expandDecimals(350 + 148 + 384, 18);
  const glpFloorPriceFund = expandDecimals(660001, 18);
  const usdcFloorPriceFund = expandDecimals(784598 + 200000, 30);

  let totalFloorPriceFundUsd;

  if (nativeToken && nativeToken.contractMinPrice && glpPrice) {
    const ethFloorPriceFundUsd = nativeTokenFloorPriceFund
      .mul(nativeToken.contractMinPrice)
      .div(expandDecimals(1, nativeToken.decimals));
    const glpFloorPriceFundUsd = glpFloorPriceFund.mul(glpPrice).div(expandDecimals(1, 18));

    totalFloorPriceFundUsd = ethFloorPriceFundUsd.add(glpFloorPriceFundUsd).add(usdcFloorPriceFund);
  }

  let adjustedUsdgSupply = bigNumberify(0);

  for (let i = 0; i < tokenList.length; i++) {
    const token = tokenList[i];
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo && tokenInfo.usdgAmount) {
      adjustedUsdgSupply = adjustedUsdgSupply.add(tokenInfo.usdgAmount);
    }
  }

  const getWeightText = (tokenInfo) => {
    if (
      !tokenInfo.weight ||
      !tokenInfo.usdgAmount ||
      !adjustedUsdgSupply ||
      adjustedUsdgSupply.eq(0) ||
      !totalTokenWeights
    ) {
      return "...";
    }

    const currentWeightBps = tokenInfo.usdgAmount.mul(BASIS_POINTS_DIVISOR).div(adjustedUsdgSupply);
    // use add(1).div(10).mul(10) to round numbers up
    const targetWeightBps = tokenInfo.weight.mul(BASIS_POINTS_DIVISOR).div(totalTokenWeights).add(1).div(10).mul(10);

    const weightText = `${formatAmount(currentWeightBps, 2, 2, false)}% / ${formatAmount(
      targetWeightBps,
      2,
      2,
      false
    )}%`;

    return (
      <TooltipComponent
        handle={weightText}
        position="right-bottom"
        renderContent={() => {
          return (
            <>
              <TooltipCardRow
                label="Current Weight"
                amount={`${formatAmount(currentWeightBps, 2, 2, false)}%`}
                showDollar={false}
              />
              <TooltipCardRow
                label="Target Weight"
                amount={`${formatAmount(targetWeightBps, 2, 2, false)}%`}
                showDollar={false}
              />
              <br />
              {currentWeightBps.lt(targetWeightBps) && (
                <div>
                  {tokenInfo.symbol} is below its target weight.
                  <br />
                  <br />
                  Get lower fees to{" "}
                  <Link to="/buy_glp" target="_blank" rel="noopener noreferrer">
                    buy GLP
                  </Link>{" "}
                  with {tokenInfo.symbol},&nbsp; and to{" "}
                  <Link to="/trade" target="_blank" rel="noopener noreferrer">
                    swap
                  </Link>{" "}
                  {tokenInfo.symbol} for other tokens.
                </div>
              )}
              {currentWeightBps.gt(targetWeightBps) && (
                <div>
                  {tokenInfo.symbol} is above its target weight.
                  <br />
                  <br />
                  Get lower fees to{" "}
                  <Link to="/trade" target="_blank" rel="noopener noreferrer">
                    swap
                  </Link>{" "}
                  tokens for {tokenInfo.symbol}.
                </div>
              )}
              <br />
              <div>
                <a href="about:blank" target="_blank" rel="noopener noreferrer">
                  More Info
                </a>
              </div>
            </>
          );
        }}
      />
    );
  };

  let stakedPercent = 25;

  let liquidityPercent = 0;

  let notStakedPercent = 100 - stakedPercent - liquidityPercent;

  let gmxDistributionData = [
    {
      name: "staked",
      value: stakedPercent,
      color: "#FBB33D",
    },
    {
      name: "in liquidity",
      value: liquidityPercent,
      color: "#3D3C3D",
    },
    {
      name: "not staked",
      value: notStakedPercent,
      color: "#3D3C3D",
    },
  ];

  const totalStatsStartDate = "06 Sep 2022";

  let stableGlp = 0;
  let totalGlp = 0;

  let glpPool = tokenList.map((token) => {
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo.usdgAmount && adjustedUsdgSupply && adjustedUsdgSupply.gt(0)) {
      const currentWeightBps = tokenInfo.usdgAmount.mul(BASIS_POINTS_DIVISOR).div(adjustedUsdgSupply);
      if (tokenInfo.isStable) {
        stableGlp += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      }
      totalGlp += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      return {
        fullname: token.name,
        name: token.symbol,
        value: parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`),
      };
    }
    return null;
  });

  let stablePercentage = totalGlp > 0 ? ((stableGlp * 100) / totalGlp).toFixed(2) : "0.0";

  glpPool = glpPool.filter(function (element) {
    return element !== null;
  });

  glpPool = glpPool.sort(function (a, b) {
    if (a.value < b.value) return 1;
    else return -1;
  });

  gmxDistributionData = gmxDistributionData.sort(function (a, b) {
    if (a.value < b.value) return 1;
    else return -1;
  });

  const [gmxActiveIndex, setGMXActiveIndex] = useState(null);

  const onGMXDistributionChartEnter = (_, index) => {
    setGMXActiveIndex(index);
  };

  const onGMXDistributionChartLeave = (_, index) => {
    setGMXActiveIndex(null);
  };

  const [glpActiveIndex, setGLPActiveIndex] = useState(null);

  const onGLPPoolChartEnter = (_, index) => {
    setGLPActiveIndex(index);
  };

  const onGLPPoolChartLeave = (_, index) => {
    setGLPActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="stats-label">
          <div className="stats-label-color" style={{ backgroundColor: payload[0].color }}></div>
          {payload[0].value}% {payload[0].name}
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    if (active) {
      library.on("block", () => {
        updatePositionStats(undefined, true);
        updateHourlyVolumes(undefined, true);
        updateAums(undefined, true);
        updateFees(undefined, true);
        updateTotalSupplies(undefined, true);
        updateStakedGmxSupply(undefined, true);
        updateTotalTokenWeights(undefined, true);
        updateLeveragePrice(undefined, true);
      });
      return () => {
        library.removeAllListeners("block");
      };
    }
  }, [
    active,
    library,
    chainId,
    updatePositionStats,
    updateHourlyVolumes,
    updateAums,
    updateFees,
    updateTotalSupplies,
    updateStakedGmxSupply,
    updateTotalTokenWeights,
    updateLeveragePrice,
  ]);

  return (
    <SEO title={getPageTitle("Dashboard")}>
      <div className="default-container DashboardV2 page-layout">
        <div className="section-title-block">
          <div className="section-title-icon"></div>
          <div className="section-title-content">
            <div className="Page-title">
              {chainId === BSC_TESTNET && <img src={bsc52Icon} alt="bsc52Icon" />}
              {chainId === VELAS_TESTNET && <img src={velas24Icon} alt="velas24Icon" className="icon-24" />}
              <Trans>Statistics</Trans>
            </div>
            <div className="Page-description">
              <Trans>
                {chainName} Total Stats start from {totalStatsStartDate}.<br /> For detailed stats:{" "}
              </Trans>
            </div>
          </div>
        </div>
        <div className="DashboardV2-content">
          <div className="DashboardV2-cards">
            <div className="App-card">
              <div className="App-card-title">
                <span className="App-card-title-content">
                  <Trans>Overview</Trans>
                </span>
              </div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">AUM</div>
                  <div>
                    <TooltipComponent
                      handle={`$${formatAmount(tvl, USD_DECIMALS, 0, true)}`}
                      position="right-bottom"
                      renderContent={() => (
                        <span className="label">{t`Assets Under Management: XVI staked (All chains) + GLP pool (${chainName})`}</span>
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">GLP Pool</div>
                  <div>
                    <TooltipComponent
                      handle={`$${formatAmount(aum, USD_DECIMALS, 0, true)}`}
                      position="right-bottom"
                      renderContent={() => (
                        <span className="label">{t`Total value of tokens in GLP pool (${chainName})`}</span>
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>24h Volume</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      handle={`$${formatAmount(currentVolumeInfo?.[chainId]?.totalVolume, USD_DECIMALS, 0, true)}`}
                      renderContent={() => (
                        <TooltipCard
                          title={t`Volume`}
                          bsc={currentVolumeInfo?.[BSC_TESTNET].totalVolume}
                          velas={currentVolumeInfo?.[VELAS_TESTNET].totalVolume}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Long Positions</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      handle={`$${formatAmount(
                        positionStatsInfo?.[chainId]?.totalLongPositionSizes,
                        USD_DECIMALS,
                        0,
                        true
                      )}`}
                      renderContent={() => (
                        <TooltipCard
                          title={t`Long Positions`}
                          bsc={positionStatsInfo?.[BSC_TESTNET].totalLongPositionSizes}
                          velas={positionStatsInfo?.[VELAS_TESTNET].totalLongPositionSizes}
                          total={positionStatsInfo?.totalLongPositionSizes}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Short Positions</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      handle={`$${formatAmount(
                        positionStatsInfo?.[chainId]?.totalShortPositionSizes,
                        USD_DECIMALS,
                        0,
                        true
                      )}`}
                      renderContent={() => (
                        <TooltipCard
                          title={t`Short Positions`}
                          bsc={positionStatsInfo?.[BSC_TESTNET].totalShortPositionSizes}
                          velas={positionStatsInfo?.[VELAS_TESTNET].totalShortPositionSizes}
                        />
                      )}
                    />
                  </div>
                </div>
                {feeHistory.length ? (
                  <div className="App-card-row">
                    <div className="label">
                      <Trans>Fees since</Trans> {formatDate(feeHistory[0].to)}
                    </div>
                    <div>
                      <TooltipComponent
                        position="right-bottom"
                        className="nowrap"
                        handle={`$${formatAmount(currentFees?.[chainId], USD_DECIMALS, 2, true)}`}
                        renderContent={() => (
                          <TooltipCard
                            title={t`Fees`}
                            bsc={currentFees?.[BSC_TESTNET]}
                            velas={currentFees?.[VELAS_TESTNET]}
                          />
                        )}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="App-card">
              <div className="App-card-title">
                <span className="App-card-title-content">
                  <Trans>Total Statistics</Trans>
                </span>
              </div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Total Fees</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      handle={`$${numberWithCommas(totalFees?.[chainId])}`}
                      renderContent={() => (
                        <TooltipCard
                          title={t`Total Fees`}
                          bsc={totalFees?.[BSC_TESTNET]}
                          velas={totalFees?.[VELAS_TESTNET]}
                          decimalsForConversion={0}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Total Volume</Trans>
                  </div>
                  <div className="App-card-value">
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      handle={`$${formatAmount(totalVolume?.[chainId], USD_DECIMALS, 0, true)}`}
                      renderContent={() => (
                        <TooltipCard
                          title={t`Total Volume`}
                          bsc={totalVolume?.[BSC_TESTNET]}
                          velas={totalVolume?.[VELAS_TESTNET]}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Claimable</Trans>
                  </div>
                  <div className="App-card-value">
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      handle={`$${formatAmount(totalFloorPriceFundUsd, 30, 0, true)}`}
                      renderContent={() => (
                        <TooltipCard
                          title={t`Claimable`}
                          bsc={totalFloorPriceFundUsd?.[BSC_TESTNET]}
                          velas={totalFloorPriceFundUsd?.[VELAS_TESTNET]}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="Tab-title-section">
            <div className="Page-title">
              {chainId === BSC_TESTNET && <img src={bsc52Icon} alt="bsc52Icon" />}
              {chainId === VELAS_TESTNET && <img src={velas24Icon} alt="velas24Icon" className="icon-24" />}
              Tokens
            </div>
            <div className="Page-description">
              <Trans>Platform and GLP index tokens.</Trans>
            </div>
          </div>
          <div className="DashboardV2-token-cards">
            <div className="stats-wrapper stats-wrapper--gmx">
              <div className="App-card">
                <div className="App-card-title stats-card-title">
                  <div className="App-card-title-mark">
                    <div className="App-card-title-mark-icon">
                      <img width="40" height="40" src={spiderIcon} alt="Biance Icon" />
                    </div>
                    <div className="App-card-title-mark-info">
                      <div className="App-card-title-mark-title">
                        <Trans>XVI</Trans>
                      </div>
                      <div className="App-card-title-mark-subtitle">
                        <Trans>XVI</Trans>
                      </div>
                    </div>
                  </div>
                  <div>
                    <AssetDropdown assetSymbol="GMX" />
                  </div>
                </div>
                <div className="stats-block">
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">Price</div>
                      <div className="App-card-value">
                        <TooltipComponent
                          position="right-bottom"
                          className="nowrap"
                          handle={"$" + formatAmount(leveragePrice, USD_DECIMALS, 2, true)}
                          renderContent={() => (
                            <>
                              <TooltipCardRow
                                label="Price on Binance"
                                amount={formatAmount(leveragePrice, USD_DECIMALS, 2, true)}
                                showDollar={true}
                              />
                            </>
                          )}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Supply</Trans>
                      </div>
                      <div className="App-card-value">
                        <TooltipComponent
                          position="right-bottom"
                          className="nowrap"
                          handle={`${formatArrayAmount(totalSupplies, 1, LEVERAGE_DECIMALS, 0, true)} XVI`}
                          renderContent={() => (
                            <TooltipCard
                              label="Supply on Binance"
                              amount={formatArrayAmount(totalSupplies, 1, LEVERAGE_DECIMALS, 0, true)}
                              showDollar={false}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Total Staked</Trans>
                      </div>
                      <div className="App-card-value">
                        <TooltipComponent
                          position="right-bottom"
                          className="nowrap"
                          handle={`$${formatAmount(stakedLeverageSupplyUsd, USD_DECIMALS, 0, true)}`}
                          renderContent={() => (
                            <TooltipCard
                              title={t`Staked`}
                              testnet={stakedLeverageSupply}
                              total={stakedLeverageSupply}
                              decimalsForConversion={LEVERAGE_DECIMALS}
                              showDollar={false}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Market Cap</Trans>
                      </div>
                      <div className="App-card-value">
                        <TooltipComponent
                          position="right-bottom"
                          className="nowrap"
                          handle={`$${formatAmount(leverageMarketCap, USD_DECIMALS, 0, true)}`}
                          renderContent={() => (
                            <TooltipCard
                              title={t`Staked`}
                              testnet={leverageMarketCap}
                              total={leverageMarketCap}
                              decimalsForConversion={USD_DECIMALS}
                              showDollar={false}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  {gmxDistributionData.length > 0 && (
                    <div className="stats-piechart" onMouseLeave={onGMXDistributionChartLeave}>
                      <div className="stats-piechart-title">
                        <div className="stats-piechart-sub-title">
                          <Trans>Staked</Trans>
                        </div>
                        <div className="stats-container">
                        <ResponsiveContainer >
                          <PieChart width={100} height={100}>
                            <Pie
                              data={gmxDistributionData}
                              cx={45}
                              cy={45}
                              innerRadius={40}
                              outerRadius={45}
                              fill="#3D3C3D"
                              dataKey="value"
                              startAngle={90}
                              endAngle={-270}
                              paddingAngle={2}
                              onMouseEnter={onGMXDistributionChartEnter}
                              onMouseOut={onGMXDistributionChartLeave}
                              onMouseLeave={onGMXDistributionChartLeave}
                            >
                              {gmxDistributionData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                  style={{
                                    filter:
                                      gmxActiveIndex === index
                                        ? `drop-shadow(0px 0px 6px ${hexToRgba(entry.color, 0.7)})`
                                        : "none",
                                    cursor: "pointer",
                                  }}
                                  stroke={entry.color}
                                  strokeWidth={gmxActiveIndex === index ? 1 : 1}
                                />
                              ))}
                            </Pie>
                            <image href={spiderIcon} x={"18"} y={"18"} width={64} height={64}></image>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                          </div>


                        <div className="stats-piechart-distribution">
                          <Trans>Distribution</Trans>
                        </div>
                        <div className="stats-piechart-distribution-percentage">
                          {`${stakedPercent}%`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="App-card">
                <div className="App-card-title stats-card-title">
                  <div className="App-card-title-mark">
                    <div className="App-card-title-mark-icon">
                      <img width="40" height="40" src={spiderIcon} alt="Biance Icon" />
                    </div>
                    <div className="App-card-title-mark-info">
                      <div className="App-card-title-mark-title">
                        <Trans>TOKEN COIN</Trans>
                      </div>
                      <div className="App-card-title-mark-subtitle">
                        <Trans>TKN</Trans>
                      </div>
                    </div>
                  </div>
                  <div>
                    <AssetDropdown assetSymbol="GMX" />
                  </div>
                </div>
                <div className="stats-block">
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Price</Trans>
                      </div>
                      <div className="App-card-value">
                        <TooltipComponent
                          position="right-bottom"
                          className="nowrap"
                          handle={"$" + formatAmount(glpPrice, USD_DECIMALS, 3, true)}
                          renderContent={() => (
                            <>
                              <TooltipCardRow
                                label="Pice on GLP"
                                amount={formatAmount(glpPrice, USD_DECIMALS, 3, true)}
                                showDollar={true}
                              />
                            </>
                          )}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Supply</Trans>
                      </div>
                      <div className="App-card-value">
                        <TooltipComponent
                          position="right-bottom"
                          className="nowrap"
                          handle={`${formatAmount(glpSupply, GLP_DECIMALS, 0, true)} GLP`}
                          renderContent={() => (
                            <TooltipCard
                              label="Supply on GLP"
                              amount={formatAmount(glpSupply, GLP_DECIMALS, 0, true)}
                              showDollar={false}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Total Staked</Trans>
                      </div>
                      <div className="App-card-value">
                        <TooltipComponent
                          position="right-bottom"
                          className="nowrap"
                          handle={`$${formatAmount(glpMarketCap, USD_DECIMALS, 0, true)}`}
                          renderContent={() => (
                            <TooltipCard
                              title={t`Staked`}
                              testnet={glpMarketCap}
                              total={glpMarketCap}
                              decimalsForConversion={GLP_DECIMALS}
                              showDollar={false}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Market Cap</Trans>
                      </div>
                      <div className="App-card-value">
                        <TooltipComponent
                          position="right-bottom"
                          className="nowrap"
                          handle={`$${formatAmount(glpMarketCap, USD_DECIMALS, 0, true)}`}
                          renderContent={() => (
                            <TooltipCard
                              title={t`Market Cap`}
                              testnet={glpMarketCap}
                              total={glpMarketCap}
                              decimalsForConversion={GLP_DECIMALS}
                              showDollar={false}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Stablecoin Percentage</Trans>
                      </div>
                      <div className="App-card-value">
                        <TooltipComponent
                          position="right-bottom"
                          className="nowrap"
                          handle={"" + stablePercentage + "%"}
                          renderContent={() => (
                            <>
                              <TooltipCardRow
                                label="Stablecoin Percentage"
                                amount={stablePercentage}
                                showDollar={false}
                              />
                            </>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {glpPool.length > 0 && (
                  <div className="stats-piechart" onMouseOut={onGLPPoolChartLeave}>
                    <div className="stats-piechart-title">
                      <div className="stats-piechart-sub-title">
                        <Trans>Staked</Trans>
                      </div>
                      <PieChart width={100} height={100}>
                        <Pie
                          data={glpPool}
                          cx={45}
                          cy={45}
                          innerRadius={40}
                          outerRadius={45}
                          fill="#3D3C3D"
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={2}
                          onMouseEnter={onGLPPoolChartEnter}
                          onMouseOut={onGLPPoolChartLeave}
                          onMouseLeave={onGLPPoolChartLeave}
                        >
                          {glpPool.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={GLPPOOLCOLORS[entry.name]}
                              style={{
                                filter:
                                  glpActiveIndex === index
                                    ? `drop-shadow(0px 0px 6px ${hexToRgba(GLPPOOLCOLORS[entry.name], 0.7)})`
                                    : "none",
                                cursor: "pointer",
                              }}
                              stroke={GLPPOOLCOLORS[entry.name]}
                              strokeWidth={glpActiveIndex === index ? 1 : 1}
                            />
                          ))}
                        </Pie>
                        <image href={spiderIcon} x={"18"} y={"18"} width={64} height={64}></image>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>

                      <div className="stats-piechart-distribution">
                        <Trans>Distribution</Trans>
                      </div>
                      <div className="stats-piechart-distribution-percentage">
                        <Trans>{stakedPercent}%</Trans>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="token-table-wrapper App-card">
              <div className="App-card-title">
                <img src={binanceIcon} width="24" height="24" />
                <img src={velasIcon} width="24" height="24" />
                <span class="App-card-title-content">
                  {" "}
                  <Trans>GLP Index Composition</Trans>{" "}
                </span>
              </div>
              <table className="token-table">
                <thead>
                  <tr>
                    <th>
                      <Trans>TOKEN</Trans>
                    </th>
                    <th>
                      <Trans>PRICE</Trans>
                    </th>
                    <th>
                      <Trans>POOL</Trans>
                    </th>
                    <th>
                      <Trans>WEIGHT</Trans>
                    </th>
                    <th>
                      <Trans>UTILIZATION</Trans>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTokens.map((token) => {
                    const tokenInfo = infoTokens[token.address];

                    let utilization = bigNumberify(0);
                    if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
                      utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
                    }
                    let maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
                    if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                      maxUsdgAmount = tokenInfo.maxUsdgAmount;
                    }
                    const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_40.svg");

                    return (
                      <tr key={token.symbol}>
                        <td>
                          <div className="token-symbol-wrapper">
                            <div className="App-card-title-info">
                              <div className="App-card-title-info-icon">
                                <img src={tokenImage} alt={token.symbol} width="40px" />
                              </div>
                              <div className="App-card-title-info-text">
                                <div className="App-card-info-title">{token.name}</div>
                                <div className="App-card-info-subtitle">{token.symbol}</div>
                              </div>
                              <div>
                                <AssetDropdown assetSymbol={token.symbol} assetInfo={token} method="simple" />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 2, true)}</td>
                        <td>
                          ${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}
                          {/* <TooltipComponent
                            handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}`}
                            position="right-bottom"
                            renderContent={() => {
                              return (
                                <>
                                  <TooltipCardRow
                                    label="Pool Amount"
                                    amount={`${formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 2, true)} ${
                                      token.symbol
                                    }`}
                                    showDollar={false}
                                  />
                                  <TooltipCardRow
                                    label="Target Min Amount"
                                    amount={`${formatKeyAmount(tokenInfo, "bufferAmount", token.decimals, 2, true)} ${
                                      token.symbol
                                    }`}
                                    showDollar={false}
                                  />
                                  <TooltipCardRow
                                    label={`Max ${tokenInfo.symbol} Capacity`}
                                    amount={formatAmount(maxUsdgAmount, 18, 0, true)}
                                    showDollar={true}
                                  />
                                </>
                              );
                            }}
                          /> */}
                        </td>
                        <td>{getWeightText(tokenInfo)}</td>
                        <td>{formatAmount(utilization, 2, 2, false)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="token-grid">
              {visibleTokens.map((token) => {
                const tokenInfo = infoTokens[token.address];
                let utilization = bigNumberify(0);
                if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
                  utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
                }
                let maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
                if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                  maxUsdgAmount = tokenInfo.maxUsdgAmount;
                }

                const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_24.svg");
                return (
                  <div className="App-card" key={token.symbol}>
                    <div className="App-card-title">
                      <div className="mobile-token-card">
                        <img src={tokenImage} alt={token.symbol} width="20px" />
                        <div className="token-symbol-text">{token.symbol}</div>
                        <div>
                          <AssetDropdown assetSymbol={token.symbol} assetInfo={token} method="simple" />
                        </div>
                      </div>
                    </div>
                    <div className="App-card-divider"></div>
                    <div className="App-card-content">
                      <div className="App-card-row">
                        <div className="label">Price</div>
                        <div>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 2, true)}</div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">Pool</div>
                        <div>
                          ${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}
                          {/* <TooltipComponent
                            handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}`}
                            position="right-bottom"
                            renderContent={() => {
                              return (
                                <>
                                  Pool Amount: {formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 2, true)}{" "}
                                  {token.symbol}
                                  <br />
                                  <br />
                                  Target Min Amount:{" "}
                                  {formatKeyAmount(tokenInfo, "bufferAmount", token.decimals, 2, true)} {token.symbol}
                                  <br />
                                  <br />
                                  Max {tokenInfo.symbol} Capacity: ${formatAmount(maxUsdgAmount, 18, 0, true)}
                                </>
                              );
                            }}
                          /> */}
                        </div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">Weight</div>
                        <div>{getWeightText(tokenInfo)}</div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">Utilization</div>
                        <div>{formatAmount(utilization, 2, 2, false)}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </SEO>
  );
}
