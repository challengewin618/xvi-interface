import React from "react";

import cx from "classnames";

import "./Checkbox.css";
import { ImCheckboxChecked } from "react-icons/im";

export default function Checkbox(props) {
  const { isChecked, setIsChecked, disabled, className } = props;

  return (
    <div
      className={cx("Checkbox", { disabled, selected: isChecked }, className)}
      onClick={() => setIsChecked(!isChecked)}
    >
      <span className="Checkbox-icon-wrapper">
        {/* {isChecked && <ImCheckboxChecked className="App-icon Checkbox-icon active" style={{ fill: "url(#blue-gradient)" }}/> } */}
        {isChecked && <ImCheckboxChecked className="App-icon Checkbox-icon active" style={{ fill: "url(#blue-gradient)" }}/> }
        {!isChecked && <ImCheckboxChecked className="App-icon Checkbox-icon inactive"  />}
      </span>
      <span className="Checkbox-label">{props.children}</span>
      <svg width="0" height="0" >
          <linearGradient id="blue-gradient" gradientTransform="rotate(80)">
            <stop stopColor="#FFDEA8" offset="24.48%" />
            <stop stopColor="#F9BD5D" offset="51.5%" />
            <stop stopColor="#E58D05" offset="100%" />
          </linearGradient>
      </svg>
    </div>
  );
}
