import { Menu } from "@headlessui/react";
import "./AssetDropdown.css";
import coingeckoIcon from "../../img/ic_coingecko_16.svg";
import metamaskIcon from "../../img/ic_metamask_16.svg";
import { addTokenToMetamask, ICONLINKS, platformTokens, useChainId } from "../../lib/legacy";
import { useWeb3React } from "@web3-react/core";
import { FiChevronRight } from "react-icons/fi";
import { Trans } from "@lingui/macro";

function AssetDropdown({ assetSymbol, assetInfo, method }) {
  const { active } = useWeb3React();
  const { chainId } = useChainId();
  let { coingecko } = ICONLINKS[chainId][assetSymbol] || {};
  const unavailableTokenSymbols =
    {
      42161: ["ETH"],
      43114: ["AVAX"],
      97: ["BNB"],
      56: ["BNB"]
    }[chainId] || [];

  return (
    <Menu>
      {method == "simple" ? (
        <Menu.Button as="div" className="dropdown-arrow center-both asset-item-arrow ">
          <FiChevronRight size={15} />
        </Menu.Button>
      ) : (
        <Menu.Button as="div" className="dropdown-arrow center-both">
          <div className="asset-item">
            <img className="asset-item-icon" src={coingeckoIcon} alt="Open in Coingecko" />
            <p>
              <Trans>Open in Coingecko</Trans>
            </p>
            <FiChevronRight size={20} />
          </div>
        </Menu.Button>
      )}
      <Menu.Items as="div" className="asset-menu-items">
        <Menu.Item>
          <>
            {coingecko && (
              <a href={coingecko} className="asset-item" target="_blank" rel="noopener noreferrer">
                <img src={coingeckoIcon} alt="Open in Coingecko" />
                <p>
                  <Trans>Open in Coingecko</Trans>
                </p>
              </a>
            )}
          </>
        </Menu.Item>
        <Menu.Item>
          <>
            {active && unavailableTokenSymbols.indexOf(assetSymbol) < 0 && (
              <div
                onClick={() => {
                  let token = assetInfo
                    ? { ...assetInfo, image: assetInfo.imageUrl }
                    : platformTokens[chainId][assetSymbol];
                  addTokenToMetamask(token);
                }}
                className="asset-item"
              >
                <img src={metamaskIcon} alt="Add to Metamask" />
                <p>
                  <Trans>Add to Metamask</Trans>
                </p>
              </div>
            )}
          </>
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}

export default AssetDropdown;
