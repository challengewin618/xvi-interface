import React, { useCallback, useState } from "react";
import "./BuyXvi.css";

import { BSC_TESTNET, VELAS_TESTNET, switchNetwork, useChainId } from "../../lib/legacy";

import { useWeb3React } from "@web3-react/core";

import Synapse from "../../img/ic_synapse.svg";
import Multiswap from "../../img/ic_multiswap.svg";
import Hop from "../../img/ic_hop.svg";
import Banxa from "../../img/ic_banxa.svg";
import Binance from "../../img/binance_52.png";

// import gmxArbitrum from "../../img/ic_gmx_arbitrum.svg";
// import gmxAvax from "../../img/ic_gmx_avax.svg";
// import ohmArbitrum from "../../img/ic_olympus_arbitrum.svg";
import Button from "../../components/Common/Button";
import SpiderIcon from "../../img/spider_icon.png";
import { Trans, t } from "@lingui/macro";
import Modal from "../../components/Modal/Modal";
import { NavLink } from "react-router-dom";
import Card from "../../components/Common/Card";
import Binance1 from "../../img/binance_1.png";
import Binance2 from "../../img/binance_2.png";
import binanceIcon from "../../img/binance_rounded_icon.png";

import VelasIcon from "../../img/velas_rounded_icon.png";
import avaxIcon from "../../img/avax_rounded_icon.png";
import maticIcon from "../../img/matic_icon.png";
import ethIcon from "../../img/eth_rounded_icon.png";
import BTCIcon from "../../img/bitcoin_rounded_icon.png";
import BinanceTitleIcon from "../../img/binance_52.png";
import VelasTitleIcon from "../../img/velas_blue.png";
export default function BuyXvi(props) {
  const { chainId } = useChainId();
  const { active } = useWeb3React();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const onNetworkSelect = useCallback(
    (value) => {
      if (value === chainId) {
        return;
      }
      return switchNetwork(value, active);
    },
    [chainId, active]
  );

  const modalHeader = () => {
    return (
      <>
        <img src={chainId === BSC_TESTNET ? BinanceTitleIcon : VelasTitleIcon} width={52} height={52} />
        <span className="buy-gmx-modal-title">
          {chainId === BSC_TESTNET &&
            (<Trans>Buy on BSC Testnet</Trans>)
          }
          {chainId === VELAS_TESTNET &&
            (<Trans>Buy on Velas Testnet</Trans>)
          }
        </span>
      </>
    );
  };

  const transferEthList = [
    {
      name: "Velas",
      link: "https://www.velas.com",
      icon: VelasIcon,
    },
    {
      name: "Avax",
      link: "https://www.avax.network/",
      icon: avaxIcon,
    },
    {
      name: "Matic",
      link: "https://www.quicknode.com/chains/matic/",
      icon: maticIcon,
    },
    {
      name: "Binance",
      link: "https://www.binance.com/",
      icon: binanceIcon,
    },
    {
      name: "ETH",
      link: "https://www.chainstack.com/",
      icon: ethIcon,
    },
    {
      name: "Bitcoin",
      link: "https://bitcoin.org",
      icon: BTCIcon,
    },
  ];
  return (
    <>
      <Modal isVisible={isModalVisible} setIsVisible={setIsModalVisible} label={modalHeader()} className="leveragePro-modal">
        <div className="BuyGMXGLP  page-layout">
          <div className="BuyGMXGLP-container">
            <div className="cards-row">
              {chainId === BSC_TESTNET && (
                <Card
                  title={t`Buy / Transfer BNB`}
                  subtitle={t`Lorem Ipsum is simply dummy text of the printing`}
                  icon={Binance1}
                >
                  <div className="App-card-content">
                    <div className="exchange-info-group">
                      <div className="BuyGMXGLP-description-1">
                        <Trans>Buy BNB</Trans>
                      </div>
                      <div className="BuyGMXGLP-description">
                        <Trans>BNB is needed on Binance to purchase XVI.</Trans>
                      </div>
                      <div className="buttons-group col-1">
                        <Button imgSrc={binanceIcon} href="https://www.binance.com/" className="binance-btn">
                          Binance
                        </Button>
                      </div>
                    </div>
                    <div className="exchange-info-group">
                      <div className="BuyGMXGLP-description-1">
                        <Trans>Transfer ETH</Trans>
                      </div>
                      <div className="BuyGMXGLP-description">
                        <Trans>
                          You can transfer ETH from other networks to Binance using any of the below options:
                        </Trans>
                      </div>
                      <div className="buttons-group col-3">
                        {transferEthList.map((item, index) => (
                          <Button key={index} href={item.link} align="left" imgSrc={item.icon}>
                            <Trans>{item.name}</Trans>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              {chainId === BSC_TESTNET && (
                <Card
                  title={t`Buy XVI Token`}
                  subtitle={t`Lorem Ipsum is simply dummy text of the printing`}
                  icon={Binance2}
                >
                  <div className="App-card-content">
                    <div className="exchange-info-group">
                      <div className="BuyGMXGLP-description-1">
                        <Trans>Purchase XVI Token</Trans>
                      </div>
                      <div className="BuyGMXGLP-description">
                        <Trans>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</Trans>
                      </div>
                      <div className="buttons-group">
                        {transferEthList.map((item, index) => (
                          <Button key={index} href={item.link} align="left" imgSrc={item.icon}>
                            <Trans>{item.name}</Trans>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {chainId === VELAS_TESTNET && (
                <Card
                  title={t`Buy / Transfer VLX`}
                  subtitle={t`Lorem Ipsum is simply dummy text of the printing`}
                  icon={Binance1}
                >
                  <div className="App-card-content">
                    <div className="exchange-info-group">
                      <div className="BuyGMXGLP-description-1">
                        <Trans>Buy VLX</Trans>
                      </div>
                      <div className="BuyGMXGLP-description">
                        <Trans>VLX is needed on Velas to purchase XVI.</Trans>
                      </div>
                      <div className="buttons-group col-1">
                        <Button imgSrc={VelasIcon} href="https://www.velas.com/" className="binance-btn">
                          Velas
                        </Button>
                      </div>
                    </div>
                    <div className="exchange-info-group">
                      <div className="BuyGMXGLP-description-1">
                        <Trans>Transfer ETH</Trans>
                      </div>
                      <div className="BuyGMXGLP-description">
                        <Trans>
                          You can transfer ETH from other networks to Binance using any of the below options:
                        </Trans>
                      </div>
                      <div className="buttons-group col-3">
                        {transferEthList.map((item, index) => (
                          <Button key={index} href={item.link} align="left" imgSrc={item.icon}>
                            <Trans>{item.name}</Trans>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              {chainId === VELAS_TESTNET && (
                <Card
                  title={t`Buy XVI Token`}
                  subtitle={t`Lorem Ipsum is simply dummy text of the printing`}
                  icon={Binance2}
                >
                  <div className="App-card-content">
                    <div className="exchange-info-group">
                      <div className="BuyGMXGLP-description-1">
                        <Trans>Purchase XVI Token</Trans>
                      </div>
                      <div className="BuyGMXGLP-description">
                        <Trans>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</Trans>
                      </div>
                      <div className="buttons-group">
                        {transferEthList.map((item, index) => (
                          <Button key={index} href={item.link} align="left" imgSrc={item.icon}>
                            <Trans>{item.name}</Trans>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </Modal>
      <>
        {!props.isModal ? (
          <NavLink onClick={() => setIsModalVisible(true)} className="buy-btn" to="#">
            {chainId === BSC_TESTNET &&
              (<Trans>Buy on BSC Testnet</Trans>)
            }
            {chainId === VELAS_TESTNET &&
              (<Trans>Buy on Velas Testnet</Trans>)
            }
          </NavLink>
        ) : (
          <NavLink onClick={() => setIsModalVisible(true)} className="App-button-option-dark App-card-option" to="#">
            <span>
              <Trans>Buy XVI Token</Trans>
            </span>
          </NavLink>
        )}
      </>
    </>
  );
}
