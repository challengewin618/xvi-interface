import React, { useState, useRef } from "react";
import Footer from "../../components/Footer/Footer";

import cx from "classnames";

import "./Home.css";

import totaluserIcon from "../../img/home_total_users.png";
import { IoIosArrowBack, IoIosArrowForward, IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import statsIcon from "../../img/home_open_interest.png";
import tradingIcon from "../../img/home_total_trading.png";
import HomeDocumentIcon from "../../img/home_document_icon.png";
import RocketIcon from "../../img/home_rocket.png";
import Slider from "@ant-design/react-slick";
import ProgressBar from "@ramonak/react-progress-bar";

// import velasIcon from "../../img/ic_avalanche_96.svg";

// import statsIcon from "../../img/ic_stats.svg";
// import tradingIcon from "../../img/ic_trading.svg";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider1 from '../../img/features/slider1.png';
import Slider2 from '../../img/features/slider2.png';
import Slider3 from '../../img/features/slider3.png';
import Slider4 from '../../img/features/slider4.png';
import Slider5 from '../../img/features/slider5.png';
import Slider6 from '../../img/features/slider6.png';
import useSWR from "swr";

import {
  formatAmount,
  bigNumberify,
  numberWithCommas,
  getServerUrl,
  USD_DECIMALS,
  getTotalVolumeSum, BSC_TESTNET,
} from "../../lib/legacy";

import {useTotalUsers, useTotalData} from "../../domain/legacy";

import TokenCard from "../../components/TokenCard/TokenCard";

import { Trans } from "@lingui/macro";
import { HeaderLink } from "../../components/Header/HeaderLink";
import SliderCard from "../../components/Common/SliderCard";


export default function Home({ showRedirectModal, redirectPopupTimestamp }) {
  const [openedFAQIndex, setOpenedFAQIndex] = useState(null)
  const sliderContent = [
    {
      image: Slider1,
      title:<Trans>Reduce Liquidition Risk</Trans>,
      content:<Trans>Lorem Ipsum is simply dummy text of the printing and transition typesetting industry.</Trans>
    },
    {
      image: Slider2,
      title:<Trans>Save on Costs</Trans>,
      content:<Trans>Lorem Ipsum is simply dummy text of the printing and transition typesetting industry.</Trans>
    },
    {
      image: Slider3,
      title:<Trans>Analytic</Trans>,
      content:<Trans>Lorem Ipsum is simply dummy text of the printing and transition typesetting industry.</Trans>
    },
    {
      image: Slider4,
      title:<Trans>Preferred Network</Trans>,
      content:<Trans>Lorem Ipsum is simply dummy text of the printing and transition typesetting industry.</Trans>
    },
    {
      image: Slider5,
      title:<Trans>Variety of Features</Trans>,
      content:<Trans>Lorem Ipsum is simply dummy text of the printing and transition typesetting industry.</Trans>
    },
    {
      image: Slider6,
      title:<Trans>Simple Swaps</Trans>,
      content:<Trans>Lorem Ipsum is simply dummy text of the printing and transition typesetting industry.</Trans>
    },
  ]
  const SliderCountArray = [1,2,3,4,5,6];
  const faqContent = [{
    id: 1,
    question: "What is XVI?",
    answer: "XVI is a decentralized spot and perpetual exchange that supports low swap fees and zero price impact trades.<br><br>Trading is supported by a unique multi-asset pool that earns liquidity providers fees from market making, swap fees, leverage trading (spreads, funding fees & liquidations), and asset rebalancing.<br><br>Dynamic pricing is supported by Chainlink Oracles along with TWAP pricing from leading volume DEXs."
  }, {
    id: 2,
    question: "What is the XVI Governance Token? ",
    answer: "The XVI token is the governance token of the XVI ecosystem, it provides the token owner voting rights on the direction of the XVI platform.<br><br>Additionally, when XVI is staked you will earn 30% of the platform-generated fees, you will also earn Escrowed XVI tokens and Multiplier Points."
  }, {
    id: 3,
    question: "What is the GLP Token? ",
    answer: "The GLP token represents the liquidity users provide to the XVI platform for Swaps and Margin Trading.<br><br>To provide liquidity to GLP you <a href='https://XVI.io/buy_glp' target='_blank'>trade</a> your crypto asset BTC, ETH, LINK, UNI, USDC, USDT, MIM, or FRAX to the liquidity pool, in exchange, you gain exposure to a diversified index of tokens while earning 50% of the platform trading fees and esXVI."
  }, {
    id: 4,
    question: "What can I trade on XVI? ",
    answer: "On XVI you can swap or margin trade any of the following assets: ETH, BTC, LINK, UNI, USDC, USDT, MIM, FRAX, with others to be added. "
  }]


  const toggleFAQContent = function(index) {
    if (openedFAQIndex === index) {
      setOpenedFAQIndex(null)
    } else {
      setOpenedFAQIndex(index)
    }
  }

  const [currentSlider, setCurrentSlider] = useState(0);
  const sliderRef = useRef();
  const settings = {
    infinite: true,
    slidesToShow: 3,
    arrows:false,
    afterChange: current => setCurrentSlider(current),
    responsive: [
      {
        breakpoint: 1000,
        settings: {
          slidesToShow: 2
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
        }
      },
    ]
  };
  // BINANCE

  const bscPositionStatsUrl = getServerUrl(BSC_TESTNET, "/position_stats");
  const { data: bscPositionStats } = useSWR([bscPositionStatsUrl], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  const bscTotalVolumeUrl = getServerUrl(BSC_TESTNET, "/total_volume");
  const { data: bscTotalVolume } = useSWR([bscTotalVolumeUrl], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });


  // Total Volume
  // const bscTotalVolumeSum = getTotalVolumeSum(bscTotalVolume);

  const { totalTradingVolume, openInterest, totalUsers } = useTotalData();

  const LaunchExchangeButton = () => {
    return (
      <HeaderLink
        className={cx("launch-exchange-btn")}
        to="/trade"
        redirectPopupTimestamp={redirectPopupTimestamp}
        showRedirectModal={showRedirectModal}
      >
        <Trans><img src={RocketIcon} width={32}/>Launch Exchange</Trans>
      </HeaderLink>
    );
  };


  const gotoNextSlider = () => {
    sliderRef.current.slickNext();
  }
  const gotoPreviousSlider = () => {
    sliderRef.current.slickPrev();
  }
  return (
    <div className="Home">
      <div className="Home-top">
        {/* <div className="Home-top-image"></div> */}
        <div className="Home-title-section-container default-container">
          <div className="Home-title-section">
            <div className="Home-doc">
                <span>
                  <Trans>Are you new? Read our documentation</Trans>
                </span>
                <HeaderLink className="home-document-btn" to="/document">
                  <img src={HomeDocumentIcon} width={32} height={14}></img>
                </HeaderLink>
              </div>
            <div className="Home-title">
              <Trans>
                Decentralized
                <br />
                Perpetual Exchange
              </Trans>
            </div>
            <div className="Home-description">
              <Trans>
                Trade BTC, ETH, BNB, BUSD, VLX and other top cryptocurrencies with up to 30x leverage directly from your wallet
              </Trans>
            </div>
            <LaunchExchangeButton />
          </div>
        </div>


      </div>
      <div className="Home-latest-info-container default-container">
          <div className="Home-latest-info-block">
            <img src={tradingIcon} alt="trading" className="Home-latest-info__icon" />
            <div className="Home-latest-info-content">
              <div className="Home-latest-info__title">
                <Trans>Total Trading Volume</Trans>
              </div>
              <div className="Home-latest-info__value">${numberWithCommas(totalTradingVolume)}</div>
            </div>
          </div>
          <div className="Home-latest-info-block">
            <img src={statsIcon} alt="trading" className="Home-latest-info__icon" />
            <div className="Home-latest-info-content">
              <div className="Home-latest-info__title">
                <Trans>Open Interest</Trans>
              </div>
              <div className="Home-latest-info__value">${numberWithCommas(openInterest)}</div>
            </div>
          </div>
          <div className="Home-latest-info-block">
            <img src={totaluserIcon} alt="trading" className="Home-latest-info__icon" />
            <div className="Home-latest-info-content">
              <div className="Home-latest-info__title">
                <Trans>Total Users</Trans>
              </div>
              <div className="Home-latest-info__value">{numberWithCommas(totalUsers.toFixed(0))}</div>
            </div>
          </div>
        </div>
      <div className="Home-benefits-section">
        <div className="Home-benefits-control">
            <span className="Home-benfits-control-title">
              <Trans>XVI FEATURES</Trans>
            </span>
            <div className="Home-benfits-description">
              <Trans>We are not just a Decentralize we are most like</Trans>
            </div>
            <div className="Home-benefits-btn-control">
              <span className="Home-benefits-left-btn" onClick = {gotoPreviousSlider}>
                <IoIosArrowBack size={24} />
              </span>
              <span className="Home-benefits-right-btn" onClick = {gotoNextSlider}>
                <Trans>
                  Next <IoIosArrowForward size={24} />
                </Trans>
              </span>
            </div>

          </div>
          <div className="Home-benfits-control-progress">
          <ProgressBar
              completed={ (currentSlider + 1) / 6 * 100}
              className="Home-benefits-control-progress-bar"
              barContainerClassName="Home-benefits-control-progress-bar-container"
              isLabelVisible = {false}
              height="6px"
              bgColor="#989898"
/>

          <div className="Home-benefits-control-progress-number">
            <span className="Home-benefits-control-section-number-icon-name">
              <Trans>Section</Trans>
            </span>
            <span className="Home-benefits-control-section-number-icon active">1</span>
            <span className="Home-benefits-control-section-number-icon">6</span>
          </div>
        </div>
        <div className="Home-benefits-slider-container">
        <Slider {...settings} className="home-slider" ref={sliderRef}>
            { sliderContent.map((item, index) => <SliderCard key={index} image={item.image} title={item.title} content={item.content}/>)}
          </Slider>
          </div>
        {/* <div className="Home-benefits default-container">
          <div className="Home-benefit">
            <div className="Home-benefit-icon">
              <img src={liquidityIcon} alt="liquidity" className="Home-benefit-icon-symbol" />
              <div className="Home-benefit-title">
                <Trans>Reduce Liquidation Risks</Trans>
              </div>
            </div>
            <div className="Home-benefit-description">
              <Trans>
                An aggregate of high-quality price feeds determine when liquidations occur. This keeps positions safe
                from temporary wicks.
              </Trans>
            </div>
          </div>
          <div className="Home-benefit">
            <div className="Home-benefit-icon">
              <img src={costIcon} alt="cost" className="Home-benefit-icon-symbol" />
              <div className="Home-benefit-title">
                <Trans>Save on Costs</Trans>
              </div>
            </div>
            <div className="Home-benefit-description">
              <Trans>
                Enter and exit positions with minimal spread and zero price impact. Get the optimal price without
                incurring additional costs.
              </Trans>
            </div>
          </div>
          <div className="Home-benefit">
            <div className="Home-benefit-icon">
              <img src={simpleSwapIcon} alt="simpleswap" className="Home-benefit-icon-symbol" />
              <div className="Home-benefit-title">
                <Trans>Simple Swaps</Trans>
              </div>
            </div>
            <div className="Home-benefit-description">
              <Trans>
                Open positions through a simple swap interface. Conveniently swap from any supported asset into the
                position of your choice.
              </Trans>
            </div>
          </div>
        </div> */}
      </div>
      <div className="Home-cta-section">
        <div className="Home-cta-container">
          <div className="Home-cta-info">
            <div className="Home-cta-info__title">
              <Trans>Available on your preferred network</Trans>
            </div>
            <div className="Home-cta-info__description">
              <Trans>XVI is currently live on Velas and BSC.</Trans>
            </div>
          </div>
          <div className="Home-cta-options">
            <div className="Home-cta-option Home-cta-option-bsc">
              <div className="Home-cta-option-icon Home-cta-option-icon-binance">
              </div>
              <div className="Home-cta-option-info">
                <div className="Home-cta-option-title"><Trans>Binance Smart Chain</Trans></div>
              </div>
            </div>
            <div className="Home-cta-option Home-cta-option-ava">
            <div className="Home-cta-option-icon Home-cta-option-icon Home-cta-option-icon-velas">
             </div>
             <div className="Home-cta-option-info">
               <div className="Home-cta-option-title"><Trans>Velas Blockchain</Trans></div>

             </div>
            </div>
          </div>
        </div>
      </div>
      <div className="Home-token-card-section">
        <div className="Home-token-card-container">
          <div className="Home-token-card-info">
            <div className="Home-token-card-info__title">
              <Trans>Two tokens create our ecosystem</Trans>
            </div>
          </div>
          <TokenCard showRedirectModal={showRedirectModal} />
        </div>
      </div>

      {/* <div className="Home-video-section">
        <div className="Home-video-container default-container">
          <div className="Home-video-block">
            <img src={gmxBigIcon} alt="gmxbig" />
          </div>
        </div>
      </div> */}
      <div className="Home-faqs-section">
        <div className="Home-faqs-introduction">
          <div className="Home-faqs-introduction__title">Frequently asked questions</div>
          <div className="Home-faqs-introduction__description">Lorem Ipsum is simply Read Documentation</div>
        </div>
        <div className="Home-faqs-content-block">
          {faqContent.map((content, index) => (
            <div
              className={openedFAQIndex === index ? "Home-faqs-content opened" : "Home-faqs-content"}
              key={index}
              onClick={() => toggleFAQContent(index)}
            >
              <div className="Home-faqs-content-header">
                <div className="Home-faqs-content-header__text">{content.question}</div>
                <div className="Home-faqs-content-header__icon">
                  {openedFAQIndex === index ? (
                    <IoIosArrowUp size={28} className="opened" />
                  ) : (
                    <IoIosArrowDown size={28} className="closed" />
                  )}
                </div>
              </div>
              <div className="Home-faqs-content-main">
                <div className="Home-faqs-content-main__text">
                  <div dangerouslySetInnerHTML={{ __html: content.answer }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer showRedirectModal={showRedirectModal} redirectPopupTimestamp={redirectPopupTimestamp} />
    </div>
  );
}
