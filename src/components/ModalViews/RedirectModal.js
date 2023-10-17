import "./RedirectModal.css";
import Modal from "../Modal/Modal";
import Checkbox from "../Checkbox/Checkbox";
import XVIIcon from '../../img/xvi_black.png';
import { t, Trans } from "@lingui/macro";
export function RedirectPopupModal({
  redirectModalVisible,
  setRedirectModalVisible,
  appRedirectUrl,
  setRedirectPopupTimestamp,
  setShouldHideRedirectModal,
  shouldHideRedirectModal,
  removeRedirectPopupTimestamp,
}) {
  const onClickAgree = () => {
    setRedirectModalVisible(false)
    if (shouldHideRedirectModal) {
      setRedirectPopupTimestamp(Date.now());
    }
  };
  return (
    <Modal
      className="RedirectModal"
      isVisible={redirectModalVisible}
      setIsVisible={setRedirectModalVisible}
      label="Launch App"
    >
      <div className="launch-app">
        <img src={XVIIcon} width={48} height={48}/>
        <div className="launch-app-desc">
          <div className="launch-app-title"><Trans>Launch App</Trans></div>
          <div className="launch-app-sub-title"><Trans>Lorem ipsum is simply dummy text</Trans></div>
        </div>
      </div>
      <div className="launch-app-desc1">
      <Trans>
        
        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry.
      </Trans>
      </div>
      <div className="submit-checkoption">
        <Checkbox isChecked={shouldHideRedirectModal} setIsChecked={setShouldHideRedirectModal}>
          <Trans>Don't show this message again for 30 days.</Trans>
        </Checkbox>
      </div>
      <div className="submit-buttons">
        <a href={appRedirectUrl} className={shouldHideRedirectModal ? "redirect-model-submit-btn active" : "redirect-model-submit-btn inactive"} onClick={onClickAgree}>
          <Trans>Submit</Trans>
        </a>
        <a href={appRedirectUrl} className="redirect-model-close-btn" onClick={onClickAgree}>
          <Trans>Close</Trans>
        </a>
      </div>
      <div className="launch-app-desc2">
        <Trans>
        It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. 
        The point of using Lorem Ipsum is that it has normal distribution of letters, as opposed to using
        </Trans>
      </div>
    </Modal>
  );
}
