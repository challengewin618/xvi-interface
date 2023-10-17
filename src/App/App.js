import React, {useCallback, useEffect, useRef, useState} from "react";
import {SWRConfig} from "swr";
import {ethers} from "ethers";
import {useWeb3React, Web3ReactProvider} from "@web3-react/core";
import {Web3Provider} from "@ethersproject/providers";
import useScrollToTop from "../lib/useScrollToTop";

import {HashRouter as Router, Route, Switch, useHistory, useLocation} from "react-router-dom";

import {
  activateInjectedProvider,
  BASIS_POINTS_DIVISOR, BSC_TESTNET,
  clearWalletConnectData,
  clearWalletLinkData,
  CURRENT_PROVIDER_LOCALSTORAGE_KEY,
  DEFAULT_SLIPPAGE_AMOUNT,
  DISABLE_ORDER_VALIDATION_KEY,
  getAppBaseUrl,
  getExplorerUrl,
  getInjectedHandler,
  getWalletConnectHandler,
  hasCoinBaseWalletExtension,
  hasMetaMaskWalletExtension,
  helperToast,
  IS_PNL_IN_LEVERAGE_KEY,
  isMobileDevice,
  LANGUAGE_LOCALSTORAGE_KEY,
  REFERRAL_CODE_KEY,
  REFERRAL_CODE_QUERY_PARAM, RPC_PROVIDERS,
  SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY,
  SHOULD_SHOW_POSITION_LINES_KEY,
  SHOW_PNL_AFTER_FEES_KEY,
  SLIPPAGE_BPS_KEY,
  useChainId,
  useEagerConnect,
  useInactiveListener,
  useLocalStorageSerializeKey, VELAS, VELAS_TESTNET,
} from "../lib/legacy";

import Home from "../pages/Home/Home";
import Dashboard from "../pages/Dashboard/Dashboard";
import Ecosystem from "../pages/Ecosystem/Ecosystem";
import Stake from "../pages/Stake/Stake";
import {Exchange} from "../pages/Exchange/Exchange";
import Actions from "../pages/Actions/Actions";
import OrdersOverview from "../pages/OrdersOverview/OrdersOverview";
import PositionsOverview from "../pages/PositionsOverview/PositionsOverview";
import Referrals from "../pages/Referrals/Referrals";
import BuyGlp from "../pages/BuyGlp/BuyGlp";
import BuyXvi from "../pages/BuyXvi/BuyXvi";
import Buy from "../pages/Buy/Buy";
import NftWallet from "../pages/NftWallet/NftWallet";
import ClaimEsGmx from "../pages/ClaimEsGmx/ClaimEsGmx";
import BeginAccountTransfer from "../pages/BeginAccountTransfer/BeginAccountTransfer";
import CompleteAccountTransfer from "../pages/CompleteAccountTransfer/CompleteAccountTransfer";

import {cssTransition, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../components/Modal/Modal";
import Checkbox from "../components/Checkbox/Checkbox";

import "../styles/Shared.css";
import "../styles/Font.css";
import "./App.scss";
import "../styles/Input.css";

import settingWaveIcon from '../img/setting_wave_icon.png';
import metamaskImg from "../img/metamask.png";
import coinbaseImg from "../img/coinbaseWallet.png";
import walletConnectImg from "../img/walletconnect-circle-blue.svg";
import useEventToast from "../components/EventToast/useEventToast";
import EventToastContainer from "../components/EventToast/EventToastContainer";
import SEO from "../components/Common/SEO";
import useRouteQuery from "../lib/useRouteQuery";
import {decodeReferralCode, encodeReferralCode} from "../domain/referrals";

import {getContract} from "../config/Addresses";
import Vault from "../abis/Vault.json";
import PositionRouter from "../abis/PositionRouter.json";
import PageNotFound from "../pages/PageNotFound/PageNotFound";
import ReferralTerms from "../pages/ReferralTerms/ReferralTerms";
import TermsAndConditions from "../pages/TermsAndConditions/TermsAndConditions";
import {useLocalStorage} from "react-use";
import {RedirectPopupModal} from "../components/ModalViews/RedirectModal";
import {REDIRECT_POPUP_TIMESTAMP_KEY} from "../config/ui";
import Jobs from "../pages/Jobs/Jobs";

import {i18n} from "@lingui/core";
import {I18nProvider} from "@lingui/react";
import {t, Trans} from "@lingui/macro";
import {defaultLocale, dynamicActivate} from "../lib/i18n";
import {Header} from "../components/Header/Header";
import _ from "lodash";

if ("ethereum" in window) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  return library;
}

const Zoom = cssTransition({
  enter: "zoomIn",
  exit: "zoomOut",
  appendPosition: false,
  collapse: true,
  collapseDuration: 200,
  duration: 200,
});

function getWsProvider(active, chainId) {
  if (!active) {
    return;
  }
  if (chainId === BSC_TESTNET) {
    return new ethers.providers.JsonRpcProvider(_.sample(RPC_PROVIDERS[chainId]));
  } else if (chainId === VELAS_TESTNET) {
    return new ethers.providers.JsonRpcProvider(_.sample(RPC_PROVIDERS[chainId]));
  }
  return;
}

function FullApp() {
  const exchangeRef = useRef();
  const {connector, library, deactivate, activate, active} = useWeb3React();
  const {chainId} = useChainId();
  const location = useLocation();
  const history = useHistory();
  useEventToast();
  const [activatingConnector, setActivatingConnector] = useState();
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector, chainId]);
  const triedEager = useEagerConnect(setActivatingConnector);
  useInactiveListener(!triedEager || !!activatingConnector);

  const query = useRouteQuery();

  useEffect(() => {
    let referralCode = query.get(REFERRAL_CODE_QUERY_PARAM);
    if (!referralCode || referralCode.length === 0) {
      const params = new URLSearchParams(window.location.search);
      referralCode = params.get(REFERRAL_CODE_QUERY_PARAM);
    }

    if (referralCode && referralCode.length <= 20) {
      const encodedReferralCode = encodeReferralCode(referralCode);
      if (encodeReferralCode !== ethers.constants.HashZero) {
        localStorage.setItem(REFERRAL_CODE_KEY, encodedReferralCode);
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.has("ref")) {
          queryParams.delete("ref");
          history.replace({
            search: queryParams.toString(),
          });
        }
      }
    }
  }, [query, history, location]);

  const disconnectAccount = useCallback(() => {
    // only works with WalletConnect
    clearWalletConnectData();
    // force clear localStorage connection for MM/CB Wallet (Brave legacy)
    clearWalletLinkData();
    deactivate();
  }, [deactivate]);

  const disconnectAccountAndCloseSettings = () => {
    disconnectAccount();
    localStorage.removeItem(SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY);
    localStorage.removeItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY);
    setIsSettingsVisible(false);
  };

  const connectInjectedWallet = getInjectedHandler(activate);
  const activateWalletConnect = () => {
    getWalletConnectHandler(activate, deactivate, setActivatingConnector)();
  };

  const userOnMobileDevice = "navigator" in window && isMobileDevice(window.navigator);

  const activateMetaMask = () => {
    if (!hasMetaMaskWalletExtension()) {
      helperToast.error(
        <div>
          <Trans>MetaMask not detected.</Trans>
          <br/>
          <br/>
          <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
            <Trans>Install MetaMask</Trans>
          </a>
          {userOnMobileDevice ? (
            <Trans>, and use XVI with its built-in browser</Trans>
          ) : (
            <Trans> to start using XVI</Trans>
          )}
          .
        </div>
      );
      return false;
    }
    attemptActivateWallet("MetaMask");
  };
  const activateCoinBase = () => {
    if (!hasCoinBaseWalletExtension()) {
      helperToast.error(
        <div>
          <Trans>Coinbase Wallet not detected.</Trans>
          <br/>
          <br/>
          <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">
            <Trans>Install Coinbase Wallet</Trans>
          </a>
          {userOnMobileDevice ? (
            <Trans>, and use XVI with its built-in browser</Trans>
          ) : (
            <Trans> to start using XVI</Trans>
          )}
          .
        </div>
      );
      return false;
    }
    attemptActivateWallet("CoinBase");
  };

  const attemptActivateWallet = (providerName) => {
    localStorage.setItem(SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY, true);
    localStorage.setItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY, providerName);
    activateInjectedProvider(providerName);
    connectInjectedWallet();
  };

  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(-1);
  const [walletSelectOption, setWalletSelectOption] = useState(false);
  const [redirectModalVisible, setRedirectModalVisible] = useState(false);
  const [shouldHideRedirectModal, setShouldHideRedirectModal] = useState(false);
  const [redirectPopupTimestamp, setRedirectPopupTimestamp, removeRedirectPopupTimestamp] =
    useLocalStorage(REDIRECT_POPUP_TIMESTAMP_KEY);
  const [selectedToPage, setSelectedToPage] = useState("");
  const connectWallet = () => setWalletModalVisible(true);

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [savedSlippageAmount, setSavedSlippageAmount] = useLocalStorageSerializeKey(
    [chainId, SLIPPAGE_BPS_KEY],
    DEFAULT_SLIPPAGE_AMOUNT
  );
  const [slippageAmount, setSlippageAmount] = useState(0);
  const [isPnlInLeverage, setIsPnlInLeverage] = useState(false);
  const [shouldDisableOrderValidation, setShouldDisableOrderValidation] = useState(false);
  const [showPnlAfterFees, setShowPnlAfterFees] = useState(false);

  const [savedIsPnlInLeverage, setSavedIsPnlInLeverage] = useLocalStorageSerializeKey(
    [chainId, IS_PNL_IN_LEVERAGE_KEY],
    false
  );

  const [savedShowPnlAfterFees, setSavedShowPnlAfterFees] = useLocalStorageSerializeKey(
    [chainId, SHOW_PNL_AFTER_FEES_KEY],
    false
  );
  const [savedShouldDisableOrderValidation, setSavedShouldDisableOrderValidation] = useLocalStorageSerializeKey(
    [chainId, DISABLE_ORDER_VALIDATION_KEY],
    false
  );

  const [savedShouldShowPositionLines, setSavedShouldShowPositionLines] = useLocalStorageSerializeKey(
    [chainId, SHOULD_SHOW_POSITION_LINES_KEY],
    false
  );

  const openSettings = () => {
    const slippage = parseInt(savedSlippageAmount);
    setSlippageAmount((slippage / BASIS_POINTS_DIVISOR) * 100);
    setIsPnlInLeverage(savedIsPnlInLeverage);
    setShowPnlAfterFees(savedShowPnlAfterFees);
    setShouldDisableOrderValidation(savedShouldDisableOrderValidation);
    setIsSettingsVisible(true);
  };

  const saveAndCloseSettings = () => {
    const slippage = parseFloat(slippageAmount);
    if (isNaN(slippage)) {
      helperToast.error(t`Invalid slippage value`);
      return;
    }
    if (slippage > 5) {
      helperToast.error(t`Slippage should be less than 5%`);
      return;
    }

    const basisPoints = (slippage * BASIS_POINTS_DIVISOR) / 100;
    if (parseInt(basisPoints) !== parseFloat(basisPoints)) {
      helperToast.error(t`Max slippage precision is 0.01%`);
      return;
    }

    setSavedIsPnlInLeverage(isPnlInLeverage);
    setSavedShowPnlAfterFees(showPnlAfterFees);
    setSavedShouldDisableOrderValidation(shouldDisableOrderValidation);
    setSavedSlippageAmount(basisPoints);
    setIsSettingsVisible(false);
  };

  const localStorageCode = window.localStorage.getItem(REFERRAL_CODE_KEY);
  const baseUrl = getAppBaseUrl();
  let appRedirectUrl = baseUrl + selectedToPage;
  if (localStorageCode && localStorageCode.length > 0 && localStorageCode !== ethers.constants.HashZero) {
    const decodedRefCode = decodeReferralCode(localStorageCode);
    if (decodedRefCode) {
      appRedirectUrl = `${appRedirectUrl}?ref=${decodedRefCode}`;
    }
  }

  const [pendingTxns, setPendingTxns] = useState([]);

  const showRedirectModal = (to) => {
    setRedirectModalVisible(true);
    setSelectedToPage(to);
  };


  useEffect(() => {
    const checkPendingTxns = async () => {
      const updatedPendingTxns = [];
      for (let i = 0; i < pendingTxns.length; i++) {
        const pendingTxn = pendingTxns[i];
        const receipt = await library.getTransactionReceipt(pendingTxn.hash);
        if (receipt) {
          if (receipt.status === 0) {
            const txUrl = getExplorerUrl(chainId) + "tx/" + pendingTxn.hash;
            helperToast.error(
              <div>
                <Trans>Txn failed.</Trans>{" "}
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  <Trans>View</Trans>
                </a>
                <br/>
              </div>
            );
          }
          if (receipt.status === 1 && pendingTxn.message) {
            const txUrl = getExplorerUrl(chainId) + "tx/" + pendingTxn.hash;
            helperToast.success(
              <div>
                {pendingTxn.message}{" "}
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  <Trans>View</Trans>
                </a>
                <br/>
              </div>
            );
          }
          continue;
        }
        updatedPendingTxns.push(pendingTxn);
      }

      if (updatedPendingTxns.length !== pendingTxns.length) {
        setPendingTxns(updatedPendingTxns);
      }
    };

    const interval = setInterval(() => {
      checkPendingTxns();
    }, 2 * 1000);
    return () => clearInterval(interval);
  }, [library, pendingTxns, chainId]);

  const vaultAddress = getContract(chainId, "Vault");
  const positionRouterAddress = getContract(chainId, "PositionRouter");

  const chooseWallet = (type) => {
    if(type == 0) {
      activateMetaMask();
    }
    if(type == 1) {
      activateCoinBase();
    }
    if(type == 2) {
      activateWalletConnect();
    }
  }
/*
  useEffect(() => {
    const wsVaultAbi = Vault.abi;
    const wsProvider = getWsProvider(active, chainId);
    if (!wsProvider) {
      return;
    }

    const wsVault = new ethers.Contract(vaultAddress, wsVaultAbi, wsProvider);
    const wsPositionRouter = new ethers.Contract(positionRouterAddress, PositionRouter.abi, wsProvider);

    const callExchangeRef = (method, ...args) => {
      if (!exchangeRef || !exchangeRef.current) {
        return;
      }

      exchangeRef.current[method](...args);
    };

    // handle the subscriptions here instead of within the Exchange component to avoid unsubscribing and re-subscribing
    // each time the Exchange components re-renders, which happens on every data update
    const onUpdatePosition = (...args) => callExchangeRef("onUpdatePosition", ...args);
    const onClosePosition = (...args) => callExchangeRef("onClosePosition", ...args);
    const onIncreasePosition = (...args) => callExchangeRef("onIncreasePosition", ...args);
    const onDecreasePosition = (...args) => callExchangeRef("onDecreasePosition", ...args);
    const onCancelIncreasePosition = (...args) => callExchangeRef("onCancelIncreasePosition", ...args);
    const onCancelDecreasePosition = (...args) => callExchangeRef("onCancelDecreasePosition", ...args);

    wsVault.on("UpdatePosition", onUpdatePosition);
    wsVault.on("ClosePosition", onClosePosition);
    wsVault.on("IncreasePosition", onIncreasePosition);
    wsVault.on("DecreasePosition", onDecreasePosition);
    wsPositionRouter.on("CancelIncreasePosition", onCancelIncreasePosition);
    wsPositionRouter.on("CancelDecreasePosition", onCancelDecreasePosition);

    return function cleanup() {
      wsVault.off("UpdatePosition", onUpdatePosition);
      wsVault.off("ClosePosition", onClosePosition);
      wsVault.off("IncreasePosition", onIncreasePosition);
      wsVault.off("DecreasePosition", onDecreasePosition);
      wsPositionRouter.off("CancelIncreasePosition", onCancelIncreasePosition);
      wsPositionRouter.off("CancelDecreasePosition", onCancelDecreasePosition);
    };
  }, [active, chainId, vaultAddress, positionRouterAddress]);
*/
  return (
    <>
      <div className="App">
        <div className="App-content">
          <Header
            disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
            openSettings={openSettings}
            setWalletModalVisible={setWalletModalVisible}
            redirectPopupTimestamp={redirectPopupTimestamp}
            showRedirectModal={showRedirectModal}
          />
          <Switch>
            <Route exact path="/">
              <Home showRedirectModal={showRedirectModal} redirectPopupTimestamp={redirectPopupTimestamp}/>
            </Route>
            <Route exact path="/trade">
              <Exchange
                ref={exchangeRef}
                savedShowPnlAfterFees={savedShowPnlAfterFees}
                savedIsPnlInLeverage={savedIsPnlInLeverage}
                setSavedIsPnlInLeverage={setSavedIsPnlInLeverage}
                savedSlippageAmount={savedSlippageAmount}
                setPendingTxns={setPendingTxns}
                pendingTxns={pendingTxns}
                savedShouldShowPositionLines={savedShouldShowPositionLines}
                setSavedShouldShowPositionLines={setSavedShouldShowPositionLines}
                connectWallet={connectWallet}
                savedShouldDisableOrderValidation={savedShouldDisableOrderValidation}
              />
            </Route>
            <Route exact path="/dashboard">
              <Dashboard/>
            </Route>
            <Route exact path="/earn">
              <Stake setPendingTxns={setPendingTxns} connectWallet={connectWallet}/>
            </Route>
            <Route exact path="/buy">
              <Buy
                savedSlippageAmount={savedSlippageAmount}
                setPendingTxns={setPendingTxns}
                connectWallet={connectWallet}
              />
            </Route>
            <Route exact path="/buy_glp">
              <BuyGlp
                savedSlippageAmount={savedSlippageAmount}
                setPendingTxns={setPendingTxns}
                connectWallet={connectWallet}
              />
            </Route>
            <Route exact path="/jobs">
              <Jobs/>
            </Route>
            <Route exact path="/buy_leveragepro">
              <BuyXvi/>
            </Route>
            <Route exact path="/ecosystem">
              <Ecosystem/>
            </Route>
            <Route exact path="/referrals">
              <Referrals pendingTxns={pendingTxns} connectWallet={connectWallet} setPendingTxns={setPendingTxns}/>
            </Route>
            <Route exact path="/referrals/:account">
              <Referrals pendingTxns={pendingTxns} connectWallet={connectWallet} setPendingTxns={setPendingTxns}/>
            </Route>
            <Route exact path="/nft_wallet">
              <NftWallet/>
            </Route>
            <Route exact path="/claim_es_gmx">
              <ClaimEsGmx setPendingTxns={setPendingTxns}/>
            </Route>
            <Route exact path="/actions">
              <Actions/>
            </Route>
            <Route exact path="/actions/:account">
              <Actions/>
            </Route>
            <Route exact path="/orders_overview">
              <OrdersOverview/>
            </Route>
            <Route exact path="/positions_overview">
              <PositionsOverview/>
            </Route>
            <Route exact path="/begin_account_transfer">
              <BeginAccountTransfer setPendingTxns={setPendingTxns}/>
            </Route>
            <Route exact path="/complete_account_transfer/:sender/:receiver">
              <CompleteAccountTransfer setPendingTxns={setPendingTxns}/>
            </Route>
            <Route exact path="/referral-terms">
              <ReferralTerms/>
            </Route>
            <Route exact path="/terms-and-conditions">
              <TermsAndConditions/>
            </Route>
            <Route path="*">
              <PageNotFound/>
            </Route>
          </Switch>
        </div>
      </div>
      <ToastContainer
        limit={1}
        transition={Zoom}
        position="bottom-right"
        autoClose={7000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        draggable={false}
        pauseOnHover
      />
      <EventToastContainer/>
      <RedirectPopupModal
        redirectModalVisible={redirectModalVisible}
        setRedirectModalVisible={setRedirectModalVisible}
        appRedirectUrl={appRedirectUrl}
        setRedirectPopupTimestamp={setRedirectPopupTimestamp}
        setShouldHideRedirectModal={setShouldHideRedirectModal}
        shouldHideRedirectModal={shouldHideRedirectModal}
        removeRedirectPopupTimestamp={removeRedirectPopupTimestamp}
      />
      <Modal
        className="Connect-wallet-modal"
        isVisible={walletModalVisible}
        setIsVisible={setWalletModalVisible}
        label="Connect Wallet"
      >
        <div className="connect-wallet-total-container">
        <div className="connect-wallet-container">
        <button className={selectedWallet == 0 ? "Wallet-btn MetaMask-btn active":"Wallet-btn MetaMask-btn"} onClick={() => {chooseWallet(0);}}>
          <img src={metamaskImg} alt="MetaMask"/>
          <div>
            <Trans>MetaMask</Trans>
          </div>
        </button>
        <button className={selectedWallet == 1 ?"Wallet-btn CoinbaseWallet-btn active":"Wallet-btn CoinbaseWallet-btn"} onClick={() => {chooseWallet(1);}}>
          <img src={coinbaseImg} alt="Coinbase Wallet"/>
          <div>
            <Trans>Coinbase Wallet</Trans>
          </div>
        </button>
        <button className={selectedWallet == 2 ?"Wallet-btn WalletConnect-btn active":"Wallet-btn WalletConnect-btn"} onClick={() => {chooseWallet(2);}}>
          <img src={walletConnectImg} alt="WalletConnect"/>
          <div>
            <Trans>Wallet Connect</Trans>
          </div>
        </button>

        </div>
        {/*<div className="connect-wallet-options">*/}
        {/*    <Checkbox isChecked={walletSelectOption} setIsChecked={setWalletSelectOption}>*/}
        {/*      <Trans>Lorem Ipsum is simply dummy text of the printing and typesetting.</Trans>*/}
        {/*    </Checkbox>*/}
        {/*  </div>*/}
        {/*  <div className="Exchange-settings-button-group wallet-btn-group">*/}
        {/*    <button className={ walletSelectOption ? "App-cta wallet-connect-button active":"App-cta wallet-connect-button inactive"} onClick={chooseWallet}>*/}
        {/*    <Trans>Save Changes</Trans>*/}
        {/*    </button>*/}
        {/*    <button className="App-cta-close-btn wallet-connect-button" onClick={() => {setWalletModalVisible(false)}}>*/}
        {/*      <Trans>Close</Trans>*/}
        {/*    </button>*/}
        {/*</div>*/}
        </div>
      </Modal>
      <Modal
        className="App-settings"
        isVisible={isSettingsVisible}
        setIsVisible={setIsSettingsVisible}
        label="More Setting"
      >
        <div className="App-settings-row">
        <div className="App-slippage-tolerance-icon">
            <img src = {settingWaveIcon} width={36} height={36}/>
            <Trans>Allowed Slippage</Trans>
          </div>
          <div className="App-slippage-tolerance-input-container">
            <input
              type="text"
              className="App-slippage-tolerance-input"
              min="0"
              value={slippageAmount + '%'}
              onChange={(e) => setSlippageAmount(e.target.value.replace('%', ''))}
            />
            {/* <div className="App-slippage-tolerance-input-percent">%</div> */}
          </div>
        </div>
        <div className="Exchange-settings-row">
          <Checkbox isChecked={showPnlAfterFees} setIsChecked={setShowPnlAfterFees}>
            <Trans>Display PnL after fees</Trans>
          </Checkbox>
        </div>
        <div className="Exchange-settings-row">
          <Checkbox isChecked={isPnlInLeverage} setIsChecked={setIsPnlInLeverage}>
            <Trans>Include PnL in leverage display</Trans>
          </Checkbox>
        </div>
        {/*{isDevelopment() && (*/}
        <div className="Exchange-settings-row">
          <Checkbox isChecked={shouldDisableOrderValidation} setIsChecked={setShouldDisableOrderValidation}>
            <Trans>Disable order validations</Trans>
          </Checkbox>
        </div>
        {/*)}*/}

        <div className="Exchange-settings-button-group">
          <button className={ showPnlAfterFees || isPnlInLeverage ||shouldDisableOrderValidation ? "App-cta Exchange-swap-button active":"App-cta Exchange-swap-button inactive"} onClick={saveAndCloseSettings}>
          <Trans>Save Changes</Trans>
          </button>
          <button className="App-cta-close-btn Exchange-swap-button" onClick={() => {setIsSettingsVisible(false)}}>
            <Trans>Close</Trans>
          </button>
        </div>
      </Modal>
    </>
  );
}

function App() {
  useScrollToTop();
  useEffect(() => {
    const defaultLanguage = localStorage.getItem(LANGUAGE_LOCALSTORAGE_KEY) || defaultLocale;
    dynamicActivate(defaultLanguage);
  }, []);
  return (
    <SWRConfig value={{refreshInterval: 60000}}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <SEO>
          <Router>
            <I18nProvider i18n={i18n}>
              <FullApp/>
            </I18nProvider>
          </Router>
        </SEO>
      </Web3ReactProvider>
    </SWRConfig>
  );
}

export default App;
