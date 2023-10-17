import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { Trans } from "@lingui/macro";

import cx from "classnames";


import {switchNetwork, useChainId, isHomeSite, BSC_TESTNET, VELAS_TESTNET} from "../../lib/legacy";

import { useWeb3React } from "@web3-react/core";

import XVIIcon from "../../img/xvi_black.png";
import ExternalLink from "../ExternalLink/ExternalLink";
import BuyXvi from "../../pages/BuyXvi/BuyXvi";

export default function TokenCard({ showRedirectModal }) {
  const isHome = isHomeSite();
  const { chainId } = useChainId();
  const { active } = useWeb3React();
  const changeNetwork = useCallback(
    (network) => {
      if (network === chainId) {
        return;
      }
      if (!active) {
        setTimeout(() => {
          return switchNetwork(network, active);
        }, 500);
      } else {
        return switchNetwork(network, active);
      }
    },
    [chainId, active]
  );

  const BuyLink = ({ className, to, children, network }) => {
    if (isHome && showRedirectModal) {
      return (
        <div className={cx("a", className)} onClick={() => showRedirectModal(to)}>
          {children}
        </div>
      );
    }

    return (
      <Link to={to} className={cx(className)} onClick={() => changeNetwork(network)}>
        {children}
      </Link>
    );
  };

  return (
    <div className="Home-token-card-options">
      <div className="Home-token-card-option">
        <div className="Home-token-card-option-icon">
          <div className="Home-token-card-option-icon-left">
            <img src={XVIIcon} alt="gmxBigIcon" width="40" /> <Trans>XVI</Trans>
          </div>
          <div className="Home-token-card-option-icon-right">
            <Trans>BSC ARP:</Trans>
            <span className="arp-value">
              {/* <APRLabel chainId={BSC_TESTNET} label="gmxAprTotal" key="AVALANCHE" /> */}
            </span>
          </div>
        </div>
        <div className="Home-token-card-option-info">
          <div className="Home-token-card-option-title">
            <Trans>
              XVI is the utility and governance token. Accrues 30% of the platform's generated fees.
            </Trans>
          </div>
          <div className="Home-token-card-option-action">
            {/* <div className="buy">
              <BuyLink to="/buy_leveragepro" className="default-btn" network={BSC_TESTNET}>
                <Trans>Buy on BSC Testnet</Trans>
              </BuyLink>
            </div> */}
            <BuyXvi />
            <ExternalLink href="about:blank" className="buy-btn-read-more">
              <Trans>Read more</Trans>
            </ExternalLink>
          </div>
        </div>
      </div>
      <div className="Home-token-card-option">
        <div className="Home-token-card-option-icon">
          <div className="Home-token-card-option-icon-left">
            <img src={XVIIcon} alt="glpBigIcon" width="40" /> GLP
          </div>
          <div className="Home-token-card-option-icon-right">
            <Trans>BSC ARP:</Trans>
            <span className="arp-value">
              {/* <APRLabel chainId={ARBITRUM} label="glpAprTotal" key="ARBITRUM" /> */}
            </span>
          </div>
        </div>
        <div className="Home-token-card-option-info">
          <div className="Home-token-card-option-title">
            <Trans>GLP is the liquidity provider token. Accrues 70% of the platform's generated fees.</Trans>
          </div>

          <div className="Home-token-card-option-action">
            <BuyLink to="/buy_glp" className="buy-btn" network={chainId}>
              {chainId === BSC_TESTNET &&
                (<Trans>Buy on BSC Testnet</Trans>)
              }
              {chainId === VELAS_TESTNET &&
                (<Trans>Buy on Velas Testnet</Trans>)
              }
            </BuyLink>
            <ExternalLink href="https://about:blank" className="buy-btn-read-more">
              <Trans>Read more</Trans>
            </ExternalLink>
          </div>
        </div>
      </div>
    </div>
  );
}
