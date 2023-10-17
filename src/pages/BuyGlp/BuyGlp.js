import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";

import GlpSwap from "../../components/Glp/GlpSwap";
import buyGLPIcon from "../../img/ic_buy_glp.svg";
import Footer from "../../components/Footer/Footer";
import "./BuyGlp.css";

import { useChainId } from "../../lib/legacy";
import { getNativeToken } from "../../config/Tokens";

import { Trans } from "@lingui/macro";
import SpiderIcon from "../../img/spider_icon.png";
import ExternalLink from "../../components/ExternalLink/ExternalLink";

export default function BuyGlp(props) {
  const { chainId } = useChainId();
  const history = useHistory();
  const [isBuying, setIsBuying] = useState(true);
  const nativeTokenSymbol = getNativeToken(chainId).symbol;

  useEffect(() => {
    const hash = history.location.hash.replace("#", "");
    const buying = hash === "redeem" ? false : true;
    setIsBuying(buying);
  }, [history.location.hash]);

  return (
    <>
    <div className="default-container buy-glp-container page-layout">
      <div className="section-title-block">
        <div className="section-title-content">
          <div className="Page-title">
            <img src={SpiderIcon} width={52} height={52} />
            <Trans>Buy / Sell GLP</Trans>
          </div>
          <div className="Page-description">
            <Trans>
              Purchase{" "}
              <a href="about:blank" target="_blank" rel="noopener noreferrer">
                GLP tokens
              </a>{" "}
              to earn {nativeTokenSymbol} fees from swaps and leverages trading.
            </Trans>
            <br />
            <Trans>Note that there is a minimum holding time of 15 minutes after a purchase.</Trans>
            <br />
            <Trans>
              View <Link to="/earn">staking</Link> page.
            </Trans>
          </div>
        </div>
      </div>
      <GlpSwap {...props} isBuying={isBuying} setIsBuying={setIsBuying} />
      
    </div>
    <Footer />
    </>
  );
}
