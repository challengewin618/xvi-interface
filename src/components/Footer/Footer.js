import React from "react";
import cx from "classnames";
import { Trans } from "@lingui/macro";
import "./Footer.css";
import logoImg from "../../img/Logo XVI.svg";
import BottomImage from '../../img/footer_bottom.png';
import { NavLink } from "react-router-dom";
import { isHomeSite } from "../../lib/legacy";
import {FaFacebook, FaTwitter, FaMediumM, FaInstagramSquare, FaDiscord, FaTelegramPlane} from 'react-icons/fa';
import ExternalLink from "../ExternalLink/ExternalLink";

// const footerLinks = {
//   home: [
//     { text: t`Terms and Conditions`, link: "about:blank", external: true },
//     { text: t`Referral Terms`, link: "about:blank", external: true },
//     { text: t`Media Kit`, link: "about:blank", external: true },
//     // { text: "Jobs", link: "/jobs", isAppLink: true },
//   ],
//   app: [
//     { text: t`Media Kit`, link: "about:blank", external: true },
//     // { text: "Jobs", link: "/jobs" },
//   ],
// };
const SOCIAL_LINKS = [
  { link: "about:blank", name: "Twitter", icon: <FaTwitter/> },
  { link: "about:blank", name: "Medium", icon: <FaMediumM/> },
  { link: "about:blank", name: "Telegram", icon: <FaTelegramPlane/> },
  // { link: "https://github.com/gmx-io", name: "Github", icon: githubIcon },
  { link: "about:blank", name: "FaceBook", icon: <FaFacebook/> },
  { link: "about:blank", name: "Instagram", icon: <FaInstagramSquare/> },
  { link: "about:blank", name: "Discord", icon: <FaDiscord/> },
];

export default function Footer({ showRedirectModal, redirectPopupTimestamp }) {
  const isHome = isHomeSite();

  return (
    <div className="Footer">
      <div className="Footer-wrapper">
        <div className="Footer-top"/>
        <div className="Footer-middle">
          <div className="Footer-logo">
            <img src={logoImg} alt="MetaMask" />
            
            <div className="copyright">
              <Trans>&copy;Copyright XVI 2022. All rights reserves <br/></Trans>
              <NavLink to="/terms-and-conditions" className="Footer-link" activeClassName="active">
                <Trans>Terms and Conditions</Trans>
              </NavLink> | &nbsp;
              <NavLink to="/referral-terms" className="Footer-link" activeClassName="active">
                <Trans>Privacy Policy</Trans>
              </NavLink>
            </div>
          </div>
          <div className="social-footer">
            <div className="social-products">
              <div className="social-products-tag">Products</div>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Updates</Trans>
              </NavLink>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Community</Trans>
              </NavLink>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Partnership</Trans>
              </NavLink>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Security</Trans>
              </NavLink>
            </div>
            <div className="social-products">
              <div className="social-products-tag">Company</div>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>About</Trans>
              </NavLink>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Blog</Trans>
              </NavLink>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Join Us</Trans>
              </NavLink>
            </div>
            <div className="social-products">
              <div className="social-products-tag">Developers</div>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Github</Trans>
              </NavLink>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Documentation</Trans>
              </NavLink>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Careers</Trans>
              </NavLink>
            </div>
            <div className="social-products">
              <div className="social-products-tag">Help</div>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Talk to Support</Trans>
              </NavLink>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>Support Docs</Trans>
              </NavLink>
              <NavLink to="/terms-copy" className="Footer-link" activeClassName="active">
                <Trans>System Status</Trans>
              </NavLink>
            </div>
            <div className="social-products-connected">
              <div className="social-products-tag">Get Connected</div>
                {SOCIAL_LINKS.map((platform) => {
                  return (
                    <ExternalLink key={platform.name} className="App-social-link" href={platform.link} >
                      {platform.icon}
                    </ExternalLink>
                  );
                })}
            </div>
          </div>
        </div>
        

        <img className="footer-bottom" src={BottomImage} />
        
      </div>
    </div>
  );
}
