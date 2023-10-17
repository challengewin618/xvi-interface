import React, { useRef, useState } from "react";
import { Menu } from "@headlessui/react";
import ModalWithPortal from "../Modal/ModalWithPortal";
import { t, Trans } from "@lingui/macro";
import cx from "classnames";
import { IoMdSettings } from "react-icons/io";
import "./NetworkDropdown.css";
import language24Icon from "../../img/ic_language24.svg";
import settingsIcon from "../../img/ic_settings_16.svg";
import bscIcon from "../../img/binance_icon_hover.png";
import velasIcon from "../../img/velas_icon.png";
import checkedIcon from "../../img/ic_checked.svg";
import { importImage, LANGUAGE_LOCALSTORAGE_KEY } from "../../lib/legacy";
import { defaultLocale, dynamicActivate, locales } from "../../lib/i18n";
import enFlag from '../../img/flag_en.png';
import esFlag from '../../img/flag_es.png';
import jaFlag from '../../img/flag_ja.png';
import koFlag from '../../img/flag_ko.png';
const LANGUAGE_MODAL_KEY = "LANGUAGE";
const NETWORK_MODAL_KEY = "NETWORK";

export default function NetworkDropdown(props) {
  const currentLanguage = useRef(localStorage.getItem(LANGUAGE_LOCALSTORAGE_KEY) || defaultLocale);
  const [activeModal, setActiveModal] = useState(null);

  function getModalContent(modalName) {
    switch (modalName) {
      case LANGUAGE_MODAL_KEY:
        return <LanguageModalContent currentLanguage={currentLanguage} />;
      case NETWORK_MODAL_KEY:
        return (
          <NetworkModalContent
            setActiveModal={setActiveModal}
            networkOptions={props.networkOptions}
            onNetworkSelect={props.onNetworkSelect}
            selectorLabel={props.selectorLabel}
            openSettings={props.openSettings}
          />
        );
      default:
        return;
    }
  }

  function getModalProps(modalName) {
    switch (modalName) {
      case LANGUAGE_MODAL_KEY:
        return {
          className: "language-popup",
          isVisible: activeModal === LANGUAGE_MODAL_KEY,
          setIsVisible: () => setActiveModal(null),
          label: t`Select Language`,
        };
      case NETWORK_MODAL_KEY:
        return {
          className: "network-popup",
          isVisible: activeModal === NETWORK_MODAL_KEY,
          setIsVisible: () => setActiveModal(null),
          label: t`Networks and Settings`,
        };
      default:
        return {};
    }
  }

  return (
    <>
      {props.small ? (
        <div className="App-header-network" onClick={() => setActiveModal(NETWORK_MODAL_KEY)}>
          <div className="network-dropdown">
            <NavIcons selectorLabel={props.selectorLabel} />
          </div>
        </div>
      ) : (
        <DesktopDropdown
          currentLanguage={currentLanguage}
          activeModal={activeModal}
          setActiveModal={setActiveModal}
          {...props}
        />
      )}
      <ModalWithPortal {...getModalProps(activeModal)}>{getModalContent(activeModal)}</ModalWithPortal>
    </>
  );
}
function NavIcons({ selectorLabel }) {
  return (
    <>
      <button className={ selectorLabel == "BSCTestnet" ? "btn-primary small transparent-BSCTestnet" :"btn-primary small transparent-VelasTestnet"}>
        {selectorLabel == "BSCTestnet" && <img className="network-dropdown-icon" src={bscIcon} alt={selectorLabel} />}
        {selectorLabel == "VelasTestnet" && <img className="network-dropdown-icon" src={velasIcon} alt={selectorLabel} />}
      </button>
      <button className={cx("btn-primary small transparent")}>
        <IoMdSettings color="white" size={24} />
      </button>
    </>
  );
}

function DesktopDropdown({ setActiveModal, selectorLabel, networkOptions, onNetworkSelect, openSettings,currentLanguage }) {
  const onLanguageChooser = (item) => {
    dynamicActivate(item);
  }
  return (
    <div className="App-header-network">
      <Menu>
        <Menu.Button as="div" className="network-dropdown">
          <NavIcons selectorLabel={selectorLabel} />
        </Menu.Button>
        <Menu.Items as="div" className="menu-items network-dropdown-items">
          <div className="dropdown-label">Networks</div>
          <div className="network-dropdown-list">
            <NetworkMenuItems
              networkOptions={networkOptions}
              selectorLabel={selectorLabel}
              onNetworkSelect={onNetworkSelect}
            />
          </div>
          <div className="network-dropdown-divider" />
          <Menu.Item>
          <div
              className="network-dropdown-menu-item menu-item "
              //onClick={() => setActiveModal(LANGUAGE_MODAL_KEY)}
            >
              <div className={cx("language-dropdown-menu", {active: currentLanguage.current === "en",})} onClick={() => onLanguageChooser("en")}>
                <img src={enFlag} />
              </div>
              <div className={cx("language-dropdown-menu", {active: currentLanguage.current === "es",})} onClick={() => onLanguageChooser("es")}>
                <img src={esFlag}/>
              </div>
              <div className={cx("language-dropdown-menu", {active: currentLanguage.current === "ja",})} onClick={() => onLanguageChooser("ja")}>
                <img src={jaFlag}/>
              </div>
              <div className={cx("language-dropdown-menu", {active: currentLanguage.current === "ko",})} onClick={() => onLanguageChooser("ko")}>
                <img src={koFlag}/>
              </div>
            </div>
          </Menu.Item>
          <Menu.Item>
            <div className="network-dropdown-menu-item menu-item last-dropdown-menu" onClick={openSettings}>
              <div className="menu-item-group">
                <div className="menu-item-icon">
                  <img className="network-dropdown-icon" src={settingsIcon} alt="" />
                </div>
                <span className="network-dropdown-item-label">
                  <Trans>Settings</Trans>
                </span>
              </div>
            </div>
          </Menu.Item>
        </Menu.Items>
      </Menu>
    </div>
  );
}

function NetworkMenuItems({ networkOptions, selectorLabel, onNetworkSelect }) {
  async function handleNetworkSelect(option) {
    await onNetworkSelect(option);
  }
  return networkOptions.map((network) => {
    const networkIcon = importImage(network.icon);
    return (
      <Menu.Item key={network.value}>
        <div
          className={cx("network-dropdown-menu-item menu-item", { [selectorLabel]: selectorLabel === network.label })}
          onClick={() => handleNetworkSelect({ value: network.value })}
        >
          <div className="menu-item-group">
            <div className="menu-item-icon">
              <img className="network-dropdown-icon" src={networkIcon} alt={network.label} />
            </div>
            <span className="network-dropdown-item-label">{network.label}</span>
          </div>
          {/* <div className="network-dropdown-menu-item-img">
            <div className={cx("active-dot", { [selectorLabel]: selectorLabel === network.label })} />
          </div> */}
        </div>
      </Menu.Item>
    );
  });
}

function LanguageModalContent({ currentLanguage }) {
  return Object.keys(locales).map((item) => {
    const image = importImage(`flag_${item}.svg`);
    return (
      <div
        key={item}
        className={cx("network-dropdown-menu-item  menu-item language-modal-item", {
          active: currentLanguage.current === item,
        })}
        onClick={() => {
          localStorage.setItem(LANGUAGE_LOCALSTORAGE_KEY, item);
          dynamicActivate(item);
        }}
      >
        <div className="menu-item-group">
          <div className="menu-item-icon">
            <img className="network-dropdown-icon" src={image} alt="language-menu-open-icon" />
          </div>
          <span className="network-dropdown-item-label menu-item-label">{locales[item]}</span>
        </div>
        <div className="network-dropdown-menu-item-img">
          {currentLanguage.current === item && <img src={checkedIcon} alt={locales[item]} />}
        </div>
      </div>
    );
  });
}
function NetworkModalContent({ networkOptions, onNetworkSelect, selectorLabel, setActiveModal, openSettings }) {
  console.log("selectorLabel:", selectorLabel);
  async function handleNetworkSelect(option) {
    await onNetworkSelect(option);
  }
  return (
    <div className="network-dropdown-items">
      <div className="network-dropdown-list">
        <span className="network-dropdown-label">Networks</span>

        {networkOptions.map((network) => {
          const networkIcon = importImage(network.icon);
          return (
            <div
              className="network-option"
              onClick={() => handleNetworkSelect({ value: network.value })}
              key={network.value}
            >
              <div className="menu-item-group">
                <img src={networkIcon} alt={network.label} />
                <span>{network.label}</span>
              </div>
              <div className={cx("active-dot", { [selectorLabel]: selectorLabel === network.label })} />
            </div>
          );
        })}
        <span className="network-dropdown-label more-options">More Options</span>
        <div
          className="network-option"
          onClick={() => {
            setActiveModal(LANGUAGE_MODAL_KEY);
          }}
        >
          <div className="menu-item-group">
            <img className="network-option-img" src={language24Icon} alt="Select Language" />
            <span className="network-option-img-label">Language</span>
          </div>
        </div>
        <div
          className="network-option"
          onClick={() => {
            openSettings();
            setActiveModal(null);
          }}
        >
          <div className="menu-item-group">
            <img className="network-option-img" src={settingsIcon} alt="" />
            <span className="network-option-img-label">Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
