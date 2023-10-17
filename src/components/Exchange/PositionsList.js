import React, {useState} from "react";
import cx from "classnames";
import {Trans} from "@lingui/macro";
import PositionSeller from "./PositionSeller";
import PositionEditor from "./PositionEditor";
import OrdersToa from "./OrdersToa";

import {
  bigNumberify,
  DECREASE,
  formatAmount,
  formatAmountFree,
  getLeverage,
  getOrderError,
  getTokenInfo,
  getUsd,
  helperToast,
  LONG, numberWithCommas,
  SWAP
} from "../../lib/legacy";
import PositionShare from "./PositionShare";
import PositionDropdown from "./PositionDropdown";
import {ethers} from "ethers";
import OrderBook from "../../abis/OrderBookNew.json";
import {getContract} from "../../config/Addresses";

const {AddressZero} = ethers.constants;

const getOrdersForPosition = (account, position, orders, nativeTokenAddress) => {
  if (!orders || orders.length === 0) {
    return [];
  }
  /* eslint-disable array-callback-return */
  return orders
    .filter((order) => {
      if (order.type === SWAP) {
        return false;
      }
      const hasMatchingIndexToken =
        order.indexToken === nativeTokenAddress
          ? position.indexToken.isNative
          : order.indexToken === position.indexToken.address;
      const hasMatchingCollateralToken =
        order.collateralToken === nativeTokenAddress
          ? position.collateralToken.isNative
          : order.collateralToken === position.collateralToken.address;
      if (order.isLong === position.isLong && hasMatchingIndexToken && hasMatchingCollateralToken) {
        return true;
      }
    })
    .map((order) => {
      order.error = getOrderError(account, order, undefined, position);
      if (order.type === DECREASE && order.sizeDelta.gt(position.size)) {
        order.error = "Order size is bigger than position, will only be executable if position increases";
      }
      return order;
    });
};

export default function PositionsList(props) {
  const {
    pendingPositions,
    setPendingPositions,
    positions,
    tokenPrices,
    positionsDataIsLoading,
    positionsMap,
    positionData,
    infoTokens,
    active,
    account,
    library,
    pendingTxns,
    setPendingTxns,
    setListSection,
    flagOrdersEnabled,
    savedIsPnlInLeverage,
    chainId,
    nativeTokenAddress,
    orders,
    setIsWaitingForPluginApproval,
    approveOrderBook,
    isPluginApproving,
    isWaitingForPluginApproval,
    orderBookApproved,
    positionRouterApproved,
    isWaitingForPositionRouterApproval,
    isPositionRouterApproving,
    approvePositionRouter,
    showPnlAfterFees,
    setMarket,
    minExecutionFee,
    minExecutionFeeUSD,
    minExecutionFeeErrorMessage,
    usdgSupply,
    totalTokenWeights,
  } = props;

  const [positionToEditKey, setPositionToEditKey] = useState(undefined);
  const [positionToSellKey, setPositionToSellKey] = useState(undefined);
  const [positionToShare, setPositionToShare] = useState(null);
  const [isPositionEditorVisible, setIsPositionEditorVisible] = useState(undefined);
  const [isPositionSellerVisible, setIsPositionSellerVisible] = useState(undefined);
  const [collateralTokenAddress, setCollateralTokenAddress] = useState(undefined);
  const [isPositionShareModalOpen, setIsPositionShareModalOpen] = useState(false);
  const [ordersToaOpen, setOrdersToaOpen] = useState(false);
  const [isHigherSlippageAllowed, setIsHigherSlippageAllowed] = useState(false);

  const editPosition = async (position) => {

  };

  const sellPosition = async (position) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const orderBookAddress = getContract(chainId, "OrderBook");
    const contract = new ethers.Contract(orderBookAddress, OrderBook.output.abi, signer);

    if (position.from === AddressZero) {
      await contract.executeOrder(
        account,
        position.id,
        bigNumberify(position.amountOut),
        position.to,
        {
          value: bigNumberify(position.amountOut),
        }
      );
    } else {
      await contract.executeOrder(
        account,
        position.id,
        bigNumberify(position.amountOut),
        position.to
      );
    }
  };

  const onPositionClick = (position) => {
    helperToast.success(`${position.type} ${position.symbol} market selected`);
    // setMarket(position.isLong ? LONG : SHORT, position.indexToken.address);
  };

  return (
    <div className="PositionsList">
      <PositionEditor
        pendingPositions={pendingPositions}
        setPendingPositions={setPendingPositions}
        positionsMap={positionsMap}
        positionKey={positionToEditKey}
        isVisible={isPositionEditorVisible}
        setIsVisible={setIsPositionEditorVisible}
        infoTokens={infoTokens}
        active={active}
        account={account}
        library={library}
        collateralTokenAddress={collateralTokenAddress}
        pendingTxns={pendingTxns}
        setPendingTxns={setPendingTxns}
        getUsd={getUsd}
        getLeverage={getLeverage}
        savedIsPnlInLeverage={savedIsPnlInLeverage}
        positionRouterApproved={positionRouterApproved}
        isPositionRouterApproving={isPositionRouterApproving}
        isWaitingForPositionRouterApproval={isWaitingForPositionRouterApproval}
        approvePositionRouter={approvePositionRouter}
        chainId={chainId}
        minExecutionFee={minExecutionFee}
        minExecutionFeeUSD={minExecutionFeeUSD}
        minExecutionFeeErrorMessage={minExecutionFeeErrorMessage}
      />
      {ordersToaOpen && (
        <OrdersToa
          setIsVisible={setOrdersToaOpen}
          approveOrderBook={approveOrderBook}
          isPluginApproving={isPluginApproving}
        />
      )}
      {isPositionShareModalOpen && (
        <PositionShare
          setIsPositionShareModalOpen={setIsPositionShareModalOpen}
          isPositionShareModalOpen={isPositionShareModalOpen}
          positionToShare={positionToShare}
          chainId={chainId}
          account={account}
        />
      )}
      {ordersToaOpen && (
        <OrdersToa
          setIsVisible={setOrdersToaOpen}
          approveOrderBook={approveOrderBook}
          isPluginApproving={isPluginApproving}
        />
      )}
      {isPositionSellerVisible && (
        <PositionSeller
          pendingPositions={pendingPositions}
          setPendingPositions={setPendingPositions}
          setIsWaitingForPluginApproval={setIsWaitingForPluginApproval}
          approveOrderBook={approveOrderBook}
          isPluginApproving={isPluginApproving}
          isWaitingForPluginApproval={isWaitingForPluginApproval}
          orderBookApproved={orderBookApproved}
          positionsMap={positionsMap}
          positionKey={positionToSellKey}
          isVisible={isPositionSellerVisible}
          setIsVisible={setIsPositionSellerVisible}
          infoTokens={infoTokens}
          active={active}
          account={account}
          orders={orders}
          library={library}
          pendingTxns={pendingTxns}
          setPendingTxns={setPendingTxns}
          flagOrdersEnabled={flagOrdersEnabled}
          savedIsPnlInLeverage={savedIsPnlInLeverage}
          chainId={chainId}
          nativeTokenAddress={nativeTokenAddress}
          setOrdersToaOpen={setOrdersToaOpen}
          positionRouterApproved={positionRouterApproved}
          isPositionRouterApproving={isPositionRouterApproving}
          isWaitingForPositionRouterApproval={isWaitingForPositionRouterApproval}
          approvePositionRouter={approvePositionRouter}
          isHigherSlippageAllowed={isHigherSlippageAllowed}
          setIsHigherSlippageAllowed={setIsHigherSlippageAllowed}
          minExecutionFee={minExecutionFee}
          minExecutionFeeUSD={minExecutionFeeUSD}
          minExecutionFeeErrorMessage={minExecutionFeeErrorMessage}
          usdgSupply={usdgSupply}
          totalTokenWeights={totalTokenWeights}
        />
      )}
      {positionData && (
        <div className="Exchange-list small">
          <div>
            {((!positionData || positionData.length === 0) && positionsDataIsLoading) && (
              <div className="Exchange-empty-positions-list-note App-card">
                <Trans>Loading...</Trans>
              </div>
            )}
            {positionData && positionData.length === 0 && !positionsDataIsLoading && (
              <div className="Exchange-empty-positions-list-note App-card">
                <Trans>No open positions</Trans>
              </div>
            )}
            {positionData && positionData.map((position, index) => {
              return (
                <div key={index} className="App-card">
                  <div className="App-card-title">
                    <span className="Exchange-list-title">{getTokenInfo(infoTokens, position.to).symbol}</span>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Leverage</Trans>
                      </div>
                      <div>
                        {position.leverage && (
                          <span className="muted">{formatAmount(position.leverage, 4, 2, true)}x&nbsp;</span>
                        )}
                        <span className={cx({positive: position.type === LONG, negative: position.type !== LONG})}>
                          {position.type}
                        </span>
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Size</Trans>
                      </div>
                      <div>{formatAmount(position.amountIn, 18, 4, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Collateral</Trans>
                      </div>
                      <div>
                        {position.symbol}
                      </div>
                    </div>
                    {/*<div className="App-card-row">*/}
                    {/*  <div className="label">*/}
                    {/*    <Trans>PnL</Trans>*/}
                    {/*  </div>*/}
                    {/*  <div>*/}
                    {/*    <span*/}
                    {/*      className={cx("Exchange-list-info-label", {*/}
                    {/*        positive: hasPositionProfit && positionDelta.gt(0),*/}
                    {/*        negative: !hasPositionProfit && positionDelta.gt(0),*/}
                    {/*        muted: positionDelta.eq(0),*/}
                    {/*      })}*/}
                    {/*    >*/}
                    {/*      {position.deltaStr} ({position.deltaPercentageStr})*/}
                    {/*    </span>*/}
                    {/*  </div>*/}
                    {/*</div>*/}
                    {/*<div className="App-card-row">*/}
                    {/*  <div className="label">*/}
                    {/*    <Trans>Net Value</Trans>*/}
                    {/*  </div>*/}
                    {/*  <div>*/}
                    {/*    <Tooltip*/}
                    {/*      handle={`$${formatAmount(position.netValue, USD_DECIMALS, 2, true)}`}*/}
                    {/*      position="right-bottom"*/}
                    {/*      handleClassName="plain"*/}
                    {/*      renderContent={() => {*/}
                    {/*        return (*/}
                    {/*          <>*/}
                    {/*            Net Value:{" "}*/}
                    {/*            {showPnlAfterFees*/}
                    {/*              ? "Initial Collateral - Fees + PnL"*/}
                    {/*              : "Initial Collateral - Borrow Fee + PnL"}*/}
                    {/*            <br />*/}
                    {/*            <br />*/}
                    {/*            Initial Collateral: ${formatAmount(position.collateral, USD_DECIMALS, 2, true)}*/}
                    {/*            <br />*/}
                    {/*            PnL: {position.deltaBeforeFeesStr}*/}
                    {/*            <br />*/}
                    {/*            Borrow Fee: ${formatAmount(position.fundingFee, USD_DECIMALS, 2, true)}*/}
                    {/*            <br />*/}
                    {/*            Open + Close fee: ${formatAmount(position.positionFee, USD_DECIMALS, 2, true)}*/}
                    {/*            <br />*/}
                    {/*            PnL After Fees: {position.deltaAfterFeesStr} ({position.deltaAfterFeesPercentageStr})*/}
                    {/*          </>*/}
                    {/*        );*/}
                    {/*      }}*/}
                    {/*    />*/}
                    {/*  </div>*/}
                    {/*</div>*/}
                    {/*<div className="App-card-row">*/}
                    {/*  <div className="label">*/}
                    {/*    <Trans>Orders</Trans>*/}
                    {/*  </div>*/}
                    {/*  <div>*/}
                    {/*    {positionOrders.length === 0 && "None"}*/}
                    {/*    {positionOrders.map((order) => {*/}
                    {/*      const orderText = () => (*/}
                    {/*        <>*/}
                    {/*          {order.triggerAboveThreshold ? ">" : "<"} {formatAmount(order.triggerPrice, 30, 2, true)}:*/}
                    {/*          {order.type === INCREASE ? " +" : " -"}${formatAmount(order.sizeDelta, 30, 2, true)}*/}
                    {/*        </>*/}
                    {/*      );*/}
                    {/*      if (order.error) {*/}
                    {/*        return (*/}
                    {/*          <div key={`${order.isLong}-${order.type}-${order.index}`} className="Position-list-order">*/}
                    {/*            <Tooltip*/}
                    {/*              className="order-error"*/}
                    {/*              handle={orderText()}*/}
                    {/*              position="right-bottom"*/}
                    {/*              handleClassName="plain"*/}
                    {/*              renderContent={() => <span className="negative">{order.error}</span>}*/}
                    {/*            />*/}
                    {/*          </div>*/}
                    {/*        );*/}
                    {/*      } else {*/}
                    {/*        return (*/}
                    {/*          <div key={`${order.isLong}-${order.type}-${order.index}`} className="Position-list-order">*/}
                    {/*            {orderText()}*/}
                    {/*          </div>*/}
                    {/*        );*/}
                    {/*      }*/}
                    {/*    })}*/}
                    {/*  </div>*/}
                    {/*</div>*/}
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Mark Price</Trans>
                      </div>
                      <div>${formatAmount(position.markPrice, 18, 4, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Entry Price</Trans>
                      </div>
                      <div>${formatAmount(position.entryPrice, 8, 4, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Liq. Price</Trans>
                      </div>
                      <div>{tokenPrices ? '$' + numberWithCommas(parseFloat(tokenPrices[position.from]).toFixed(2)) : '...'}</div>
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-options">
                    <button
                      className="App-button-option App-card-option"
                      // disabled={position.size.eq(0)}
                      onClick={() => sellPosition(position)}
                    >
                      Close
                    </button>
                    <button
                      className="App-button-option App-card-option"
                      // disabled={position.size.eq(0)}
                      onClick={() => editPosition(position)}
                    >
                      <Trans> Edit</Trans>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <table className="Exchange-list large App-box">
        <tbody>
        <tr className="Exchange-list-header">
          <th>
            <Trans>Position</Trans>
          </th>
          {/*<th>*/}
          {/*  <Trans>Net Value</Trans>*/}
          {/*</th>*/}
          <th>
            <Trans>Size</Trans>
          </th>
          <th>
            <Trans>Collateral</Trans>
          </th>
          <th>
            <Trans>Mark Price</Trans>
          </th>
          <th>
            <Trans>Entry Price</Trans>
          </th>
          <th>
            <Trans>Liq. Price</Trans>
          </th>
          <th></th>
          <th></th>
        </tr>
        {((!positionData || positionData.length === 0) && positionsDataIsLoading) && (
          <tr>
            <td colSpan="15">
              <div className="Exchange-empty-positions-list-note">Loading...</div>
            </td>
          </tr>
        )}
        {positionData && positionData.length === 0 && !positionsDataIsLoading && (
          <tr>
            <td colSpan="15">
              <div className="Exchange-empty-positions-list-note">No open positions</div>
            </td>
          </tr>
        )}
        {positionData && positionData.map((position, index) => {
          // const liquidationPrice = getLiquidationPrice(position) || bigNumberify(0);
          // const positionOrders = getOrdersForPosition(account, position, orders, nativeTokenAddress);
          // const hasOrderError = !!positionOrders.find((order) => order.error);
          // const hasPositionProfit = position[showPnlAfterFees ? "hasProfitAfterFees" : "hasProfit"];
          // const positionDelta =
          //   position[showPnlAfterFees ? "pendingDeltaAfterFees" : "pendingDelta"] || bigNumberify(0);
          // let borrowFeeText;
          // if (position.collateralToken && position.collateralToken.fundingRate) {
          //   const borrowFeeRate = position.collateralToken.fundingRate
          //     .mul(position.size)
          //     .mul(24)
          //     .div(FUNDING_RATE_PRECISION);
          //   borrowFeeText = t`Borrow Fee / Day: $${formatAmount(borrowFeeRate, USD_DECIMALS, 2, true)}`;
          // }

          return (
            <tr key={index}>
              {/*<td className="clickable" onClick={() => onPositionClick(position)}>*/}
              <td className="clickable">
                <div className="Exchange-list-title">
                  {getTokenInfo(infoTokens, position.to).symbol}
                  {/*{position.hasPendingChanges && <ImSpinner2 className="spin position-loading-icon" />}*/}
                </div>
                <div className="Exchange-list-info-label">
                  {position.leverage && (
                    <span className="muted">{formatAmount(position.leverage, 4, 2, true)}x&nbsp;</span>
                  )}
                  <span className={cx({positive: position.type === LONG, negative: position.type !== LONG})}>
                      {position.type}
                    </span>
                </div>
              </td>
              {/*<td>*/}
              {/*  <div>*/}
              {/*    {!position.netValue && "Opening..."}*/}
              {/*    {position.netValue && (*/}
              {/*      <Tooltip*/}
              {/*        handle={`$${formatAmount(position.netValue, USD_DECIMALS, 2, true)}`}*/}
              {/*        position="left-bottom"*/}
              {/*        handleClassName="plain"*/}
              {/*        renderContent={() => {*/}
              {/*          return (*/}
              {/*            <>*/}
              {/*              Net Value:{" "}*/}
              {/*              {showPnlAfterFees*/}
              {/*                ? "Initial Collateral - Fees + PnL"*/}
              {/*                : "Initial Collateral - Borrow Fee + PnL"}*/}
              {/*              <br />*/}
              {/*              <br />*/}
              {/*              Initial Collateral: ${formatAmount(position.collateral, USD_DECIMALS, 2, true)}*/}
              {/*              <br />*/}
              {/*              PnL: {position.deltaBeforeFeesStr}*/}
              {/*              <br />*/}
              {/*              Borrow Fee: ${formatAmount(position.fundingFee, USD_DECIMALS, 2, true)}*/}
              {/*              <br />*/}
              {/*              Open + Close fee: ${formatAmount(position.positionFee, USD_DECIMALS, 2, true)}*/}
              {/*              <br />*/}
              {/*              <br />*/}
              {/*              PnL After Fees: {position.deltaAfterFeesStr} ({position.deltaAfterFeesPercentageStr})*/}
              {/*            </>*/}
              {/*          );*/}
              {/*        }}*/}
              {/*      />*/}
              {/*    )}*/}
              {/*  </div>*/}
              {/*  {position.deltaStr && (*/}
              {/*    <div*/}
              {/*      className={cx("Exchange-list-info-label", {*/}
              {/*        positive: hasPositionProfit && positionDelta.gt(0),*/}
              {/*        negative: !hasPositionProfit && positionDelta.gt(0),*/}
              {/*        muted: positionDelta.eq(0),*/}
              {/*      })}*/}
              {/*    >*/}
              {/*      {position.deltaStr} ({position.deltaPercentageStr})*/}
              {/*    </div>*/}
              {/*  )}*/}
              {/*</td>*/}
              <td>
                <div>{formatAmount(position.amountIn, 18, 4, true)}</div>
                {/*{positionOrders.length > 0 && (*/}
                {/*  <div onClick={() => setListSection && setListSection("Orders")}>*/}
                {/*    <Tooltip*/}
                {/*      handle={`Orders (${positionOrders.length})`}*/}
                {/*      position="left-bottom"*/}
                {/*      handleClassName={cx(*/}
                {/*        ["Exchange-list-info-label", "Exchange-position-list-orders", "plain", "clickable"],*/}
                {/*        { muted: !hasOrderError, negative: hasOrderError }*/}
                {/*      )}*/}
                {/*      renderContent={() => {*/}
                {/*        return (*/}
                {/*          <>*/}
                {/*            <strong>Active Orders</strong>*/}
                {/*            {positionOrders.map((order) => {*/}
                {/*              return (*/}
                {/*                <div*/}
                {/*                  key={`${order.isLong}-${order.type}-${order.index}`}*/}
                {/*                  className="Position-list-order"*/}
                {/*                >*/}
                {/*                  {order.triggerAboveThreshold ? ">" : "<"}{" "}*/}
                {/*                  {formatAmount(order.triggerPrice, 30, 2, true)}:*/}
                {/*                  {order.type === INCREASE ? " +" : " -"}${formatAmount(order.sizeDelta, 30, 2, true)}*/}
                {/*                  {order.error && (*/}
                {/*                    <>*/}
                {/*                      , <span className="negative">{order.error}</span>*/}
                {/*                    </>*/}
                {/*                  )}*/}
                {/*                </div>*/}
                {/*              );*/}
                {/*            })}*/}
                {/*          </>*/}
                {/*        );*/}
                {/*      }}*/}
                {/*    />*/}
                {/*  </div>*/}
                {/*)}*/}
              </td>
              <td>
                {position.symbol}
                {/*<Tooltip*/}
                {/*  handle={`$${formatAmount(position.collateralAfterFee, USD_DECIMALS, 2, true)}`}*/}
                {/*  position="left-bottom"*/}
                {/*  handleClassName={cx("plain", { negative: position.hasLowCollateral })}*/}
                {/*  renderContent={() => {*/}
                {/*    return (*/}
                {/*      <>*/}
                {/*        {position.hasLowCollateral && (*/}
                {/*          <div>*/}
                {/*            <Trans>*/}
                {/*              WARNING: This position has a low amount of collateral after deducting borrowing fees,*/}
                {/*              deposit more collateral to reduce the position's liquidation risk.*/}
                {/*            </Trans>*/}
                {/*            <br />*/}
                {/*            <br />*/}
                {/*          </div>*/}
                {/*        )}*/}
                {/*        <Trans>Initial Collateral: ${formatAmount(position.collateral, USD_DECIMALS, 2, true)}</Trans>*/}
                {/*        <br />*/}
                {/*        <Trans>Borrow Fee: ${formatAmount(position.fundingFee, USD_DECIMALS, 2, true)}</Trans>*/}
                {/*        {borrowFeeText && <div>{borrowFeeText}</div>}*/}
                {/*        <br />*/}
                {/*        <Trans>Use the "Edit" button to deposit or withdraw collateral.</Trans>*/}
                {/*      </>*/}
                {/*    );*/}
                {/*  }}*/}
                {/*/>*/}
              </td>
              <td className="clickable" onClick={() => onPositionClick(position)}>
                ${formatAmount(position.markPrice, 18, 4, true)}
              </td>
              <td className="clickable" onClick={() => onPositionClick(position)}>
                {/*<Tooltip*/}
                {/*  handle={`$${formatAmount(position.markPrice, USD_DECIMALS, 2, true)}`}*/}
                {/*  position="left-bottom"*/}
                {/*  handleClassName="plain clickable"*/}
                {/*  renderContent={() => {*/}
                {/*    return (*/}
                {/*      <>*/}
                {/*        Click on a row to select the position's market, then use the swap box to increase your*/}
                {/*        position size if needed.*/}
                {/*        <br />*/}
                {/*        <br />*/}
                {/*        Use the "Close" button to reduce your position size, or to set stop-loss / take-profit orders.*/}
                {/*      </>*/}
                {/*    );*/}
                {/*  }}*/}
                {/*/>
                  */}
                ${formatAmount(position.entryPrice, 8, 4, true)}
              </td>
              <td className="clickable" onClick={() => onPositionClick(position)}>
                {tokenPrices ? '$' + numberWithCommas(parseFloat(tokenPrices[position.from]).toFixed(2)) : '...'}
              </td>

              <td>
                <button
                  className="Exchange-list-action"
                  onClick={() => sellPosition(position)}
                  // disabled={position.size.eq(0)}
                >
                  Close
                </button>
              </td>
              <td>
                <PositionDropdown
                  handleEditCollateral={() => {
                    editPosition(position);
                  }}
                />
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  );
}
