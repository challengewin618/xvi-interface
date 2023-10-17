import React, { ReactNode, useEffect, useState } from "react";
import cx from "classnames";

import { AppHeaderUser } from "./AppHeaderUser";
import { HeaderLink } from "./HeaderLink";
import { AppHeaderLinks } from "./AppHeaderLinks";
import {Trans} from "@lingui/macro";
import logoImg from "../../img/Logo XVI.svg";
import logoSmallImg from "../../img/logo_XVI_small.svg";
import { RiMenuLine } from "react-icons/ri";
import { FaTimes } from "react-icons/fa";
import { AnimatePresence as FramerAnimatePresence, motion } from "framer-motion";

import "./Header.css";
import { isHomeSite } from "../../lib/legacy";

// Fix framer-motion old React FC type (solved in react 18)
const AnimatePresence = (props: React.ComponentProps<typeof FramerAnimatePresence> & { children: ReactNode }) => (
  <FramerAnimatePresence {...props} />
);

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const slideVariants = {
  hidden: { x: "-100%" },
  visible: { x: 0 },
};

type Props = {
  disconnectAccountAndCloseSettings: () => void;
  openSettings: () => void;
  setWalletModalVisible: (visible: boolean) => void;
  redirectPopupTimestamp: number;
  showRedirectModal: (to: string) => void;
};

export function Header({
  disconnectAccountAndCloseSettings,
  openSettings,
  setWalletModalVisible,
  redirectPopupTimestamp,
  showRedirectModal
}: Props) {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isNativeSelectorModalVisible, setIsNativeSelectorModalVisible] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', isSticky);
    return () => {
        window.removeEventListener('scroll', isSticky);
    };
  });
  useEffect(() => {
    if (isDrawerVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDrawerVisible]);
  const isSticky = (e) => {
    const header = document.querySelector('.header-section');
    const scrollTop = window.scrollY;
    scrollTop >= 250 ? header?.classList.add('is-sticky') : header?.classList.remove('is-sticky');
    if ( scrollTop >= 250 && showStickyNode == 0 ) {
      setShowStickyNode(1);
    }
  };
  const [showStickyNode, setShowStickyNode] = useState(0);
  return (
    <>
      {isDrawerVisible && (
        <AnimatePresence>
          {isDrawerVisible && (
            <motion.div
              className="App-header-backdrop"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeVariants}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerVisible(!isDrawerVisible)}
            ></motion.div>
          )}
        </AnimatePresence>
      )}
      {isNativeSelectorModalVisible && (
        <AnimatePresence>
          {isNativeSelectorModalVisible && (
            <motion.div
              className="selector-backdrop"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeVariants}
              transition={{ duration: 0.2 }}
              onClick={() => setIsNativeSelectorModalVisible(!isNativeSelectorModalVisible)}
            ></motion.div>
          )}
        </AnimatePresence>
      )}
      <header className="header-section">
        <div className={showStickyNode == 1 ? "header-sticky-notification" :"header-sticky-notification-hide"}>
          <div className="header-sticky-noti-title">
            <Trans>The XVI Community is coming together. Get your tickets to breakpoint, Nov. 4-7 In Lisbon!</Trans>
          </div>
          <div className="header-sticky-noti-title-close-btn" onClick = { () => {setShowStickyNode(2)}}>
            <FaTimes size={12}/>
          </div>
          </div>
        <div className="App-header large">
          <div className="App-header-container-left">
            <HeaderLink
              isHomeLink={true}
              exact={true}
              className="App-header-link-main"
              to="/"
              redirectPopupTimestamp={redirectPopupTimestamp}
              showRedirectModal={showRedirectModal}
            >
              <img src={logoImg} className="big" alt="XVI Logo" />
              <img src={logoSmallImg} className="small" alt="XVI Logo" />
            </HeaderLink>
              <AppHeaderLinks redirectPopupTimestamp={redirectPopupTimestamp} showRedirectModal={showRedirectModal} />
          </div>
          <div className="App-header-container-right">
            <AppHeaderUser
              disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
              openSettings={openSettings}
              setWalletModalVisible={setWalletModalVisible}
              redirectPopupTimestamp={redirectPopupTimestamp}
              showRedirectModal={showRedirectModal}
            />
          </div>
        </div>
        <div className={cx("App-header", "small", { active: isDrawerVisible })}>
          <div
            className={cx("App-header-link-container", "App-header-top", {
              active: isDrawerVisible,
            })}
          >
            <div className="App-header-container-left">
              <div className="App-header-menu-icon-block" onClick={() => setIsDrawerVisible(!isDrawerVisible)}>
                {!isDrawerVisible && <RiMenuLine className="App-header-menu-icon" />}
                {isDrawerVisible && <FaTimes className="App-header-menu-icon" />}
              </div>
              <div className="App-header-link-main clickable" onClick={() => setIsDrawerVisible(!isDrawerVisible)}>
                <img src={logoImg} className="big" alt="XVI Logo" />
                <img src={logoSmallImg} className="small" alt="XVI Logo" />
              </div>
            </div>
            <div className="App-header-container-right">
              <AppHeaderUser
                disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
                openSettings={openSettings}
                small
                setWalletModalVisible={setWalletModalVisible}
                redirectPopupTimestamp={redirectPopupTimestamp}
                showRedirectModal={showRedirectModal}
              />
            </div>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {isDrawerVisible && (
          <motion.div
            onClick={() => setIsDrawerVisible(false)}
            className="App-header-links-container App-header-drawer"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={slideVariants}
            transition={{ duration: 0.2 }}
          >
              <AppHeaderLinks
                small
                openSettings={openSettings}
                clickCloseIcon={() => setIsDrawerVisible(false)}
                redirectPopupTimestamp={redirectPopupTimestamp}
                showRedirectModal={showRedirectModal}
              />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
