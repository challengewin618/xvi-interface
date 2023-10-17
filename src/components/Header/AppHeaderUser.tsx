import {useWeb3React} from "@web3-react/core";
import AddressDropdown from "../AddressDropdown/AddressDropdown";
import {ConnectWalletButton} from "../Common/Button";
import React, {useCallback, useEffect} from "react";
import {HeaderLink} from "./HeaderLink";
import connectWalletImg from "../../img/ic_wallet_24.svg";
import UnionIcon from "../../img/header_union.svg";
import ExternalLink from "../ExternalLink/ExternalLink";
import { FaTwitter, FaDiscord, FaTelegramPlane} from 'react-icons/fa';
import "./Header.css";
import {
  BSC,
  BSC_TESTNET,
  getAccountUrl,
  getChainName,
  isHomeSite,
  switchNetwork,
  useChainId,
  VELAS_TESTNET
} from "../../lib/legacy";
import cx from "classnames";
import NetworkDropdown from "../NetworkDropdown/NetworkDropdown";
import LanguagePopupHome from "../NetworkDropdown/LanguagePopupHome";
import {Trans} from "@lingui/macro";

type Props = {
  openSettings: () => void;
  small?: boolean;
  setWalletModalVisible: (visible: boolean) => void;
  disconnectAccountAndCloseSettings: () => void;
  redirectPopupTimestamp: number;
  showRedirectModal: (to: string) => void;
};

export function AppHeaderUser({
 openSettings,
 small,
 setWalletModalVisible,
 disconnectAccountAndCloseSettings,
 redirectPopupTimestamp,
 showRedirectModal
}: Props) {
  const { chainId } = useChainId();
  const { active, account } = useWeb3React();
  const showConnectionOptions = !isHomeSite();

  const networkOptions = [
    {
      label: getChainName(BSC_TESTNET),
      value: BSC_TESTNET,
      icon: "binance_icon_hover.png",
      color: "#ff0000",
    },
    {
      label: getChainName(VELAS_TESTNET),
      value: VELAS_TESTNET,
      icon: "velas_icon.png",
      color: "#264f79",
    }
  ];

  useEffect(() => {
    if (active) {
      setWalletModalVisible(false);
    }
  }, [active, setWalletModalVisible]);

  const onNetworkSelect = useCallback(
    (option) => {
      if (option.value === chainId) {
        return;
      }
      return switchNetwork(option.value, active);
    },
    [chainId, active]
  );

  const selectorLabel = getChainName(chainId);

  if (!active) {
    return (
      <div className="App-header-user">
        {showConnectionOptions ? (
          <>
            <ConnectWalletButton onClick={() => setWalletModalVisible(true)} imgSrc={connectWalletImg}>
              {small ? <Trans>Connect</Trans> : <Trans>Connect Wallet</Trans>}
            </ConnectWalletButton>
            <div className={cx("App-header-trade-link", { "homepage-header": isHomeSite() })}>
              <HeaderLink
                className="header-trade-btn"
                to="/trade"
                redirectPopupTimestamp={redirectPopupTimestamp}
                showRedirectModal={showRedirectModal}
              >
                <Trans>
                  <img src={UnionIcon} width={16}></img>Trade
                </Trans>
              </HeaderLink>
            </div>
            <NetworkDropdown
              small={small}
              networkOptions={networkOptions}
              selectorLabel={selectorLabel}
              onNetworkSelect={onNetworkSelect}
              openSettings={openSettings}
            />
          </>
        ) : (
          <>
          <ExternalLink className="App-social-link" href="about:blank" >
            <FaTwitter/>
          </ExternalLink>
          <ExternalLink className="App-social-link" href="about:blank" >
            <FaDiscord/>
          </ExternalLink>
          <ExternalLink className="App-social-link" href="about:blank" >
            <FaTelegramPlane/>
          </ExternalLink>
          <div className={cx("App-header-trade-link", { "homepage-header": isHomeSite() })}>
            <HeaderLink
              className="header-trade-btn-home"
              to="/trade"
              redirectPopupTimestamp={redirectPopupTimestamp}
              showRedirectModal={showRedirectModal}
            >
              <Trans>
                <img src={UnionIcon} width={20}></img>Trade
              </Trans>
            </HeaderLink>
          </div>
          </>
        )}
      </div>
    );
  }

  const accountUrl = getAccountUrl(chainId, account);

  return (
    <div className="App-header-user">
      <div className="App-header-trade-link">
        <HeaderLink
          className="header-trade-btn"
          to="/trade"
          redirectPopupTimestamp={redirectPopupTimestamp}
          showRedirectModal={showRedirectModal}
        >
          <img src={UnionIcon} width={16}></img><Trans>Trade</Trans>
        </HeaderLink>
      </div>

      {showConnectionOptions ? (
        <>
          <div className="App-header-user-address">
            <AddressDropdown
              account={account}
              accountUrl={accountUrl}
              disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
            />
          </div>
          <NetworkDropdown
            small={small}
            networkOptions={networkOptions}
            selectorLabel={selectorLabel}
            onNetworkSelect={onNetworkSelect}
            openSettings={openSettings}
          />
        </>
      ) : (
        <LanguagePopupHome />
      )}
    </div>
  );
}
