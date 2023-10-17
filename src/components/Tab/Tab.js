import React from "react";

import cx from "classnames";

import "./Tab.css";

export default function Tab(props) {
  const { options, option, setOption, onChange, type = "block", className, optionLabels, icons } = props;
  const onClick = (opt) => {
    if (setOption) {
      setOption(opt);
    }
    if (onChange) {
      onChange(opt);
    }
  };

  return (
    <div className={cx("Tab", type, className)}>
      {options.map((opt, index) => {
        const label = optionLabels && optionLabels[opt] ? optionLabels[opt] : opt;
        return (
          <div className={cx("Tab-option", {disabled: index == options.length - 1 && props.isSwipe }, { active: opt === option })} onClick={() => (options.length - 1 == index && props.isSwipe) ? "":onClick(opt)} key={opt}>
            {icons && icons[opt] && (opt === option ? <img className="Tab-option-icon" src={props.activeIcons[opt]} alt={option} /> :<img className="Tab-option-icon" src={icons[opt]} alt={option} />)}
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
