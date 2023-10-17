import { Menu } from "@headlessui/react";
import { FiChevronDown } from "react-icons/fi";
import "./HeaderDropDown.css";
import UserIcon from "../../img/header_user.svg";
import DocumentIcon from "../../img/header_document.svg";
import AboutUsIcon from "../../img/header_aboutus.svg";
import {  Trans } from "@lingui/macro";
import { HeaderLink } from "./HeaderLink";
import ExternalLink from "../ExternalLink/ExternalLink";


type Props = {
  redirectPopupTimestamp: number;
  showRedirectModal: (to: string) => void;
};

function HeaderDropDown({ redirectPopupTimestamp, showRedirectModal }: Props) {
  const dropDownMenuItem = [
    {
      link: "/referrals",
      img: UserIcon,
      alt: "Referrals",
      method: "internal",
      subContent: "Lorem Ipsum is simply dummy text",
    },
    {
      link: "about:blank",
      img: DocumentIcon,
      alt: "Documents",
      method: "external",
      subContent: "Lorem Ipsum is simply dummy text",
    },
    {
      link: "about:blank",
      img: AboutUsIcon,
      alt: "About Us",
      method: "external",
      subContent: "Lorem Ipsum is simply dummy text",
    },
  ];
  return (
    <Menu>
      <Menu.Button as="div" className="header-dropdown-arrow">
        <Trans>More</Trans>
        <FiChevronDown size={16} className="header-dropdown-arrow-icon" />
        <Menu.Items as="div" className="header-asset-menu-items">
          {dropDownMenuItem.map((item, index) => {
            return (
              <Menu.Item key={index}>
                <>
                  {item.method == "external" ? (
                    <ExternalLink href={item.link} className="header-asset-item">
                      <span className="header-asset-item-image-div">
                        <img className="header-asset-item-icon" src={item.img} alt={item.alt} />
                      </span>
                      <p>
                        <span className="header-assset-item-name">
                          <Trans>{item.alt}</Trans>
                        </span>
                        <br />
                        <span className="header-assset-item-subcontent">
                          <Trans>{item.subContent}</Trans>
                        </span>
                      </p>
                    </ExternalLink>
                  ) : (
                    <HeaderLink
                      to={item.link}
                      redirectPopupTimestamp={redirectPopupTimestamp}
                      showRedirectModal={showRedirectModal}
                      className="header-asset-item"
                    >
                      <span className="header-asset-item-image-div">
                        <img className="header-asset-item-icon" src={item.img} alt={item.alt} />
                      </span>
                      <p>
                        <span className="header-assset-item-name">
                          <Trans>{item.alt}</Trans>
                        </span>
                        <br />
                        <span className="header-assset-item-subcontent">
                          <Trans>{item.subContent}</Trans>
                        </span>
                      </p>
                    </HeaderLink>
                  )}

                  {index < 2 ? <div className="header-dropdown-space" /> : ""}
                </>
              </Menu.Item>
            );
          })}
        </Menu.Items>
      </Menu.Button>
    </Menu>
  );
}

export default HeaderDropDown;
