import { ReactNode } from "react";
import Tooltip from "../Tooltip/Tooltip";
import "./SliderCard.css";
import { Trans } from "@lingui/macro";
type Props = {
  title: string;
  content: ReactNode;
  className?: string;
  image:string
};

function SliderCard({ title, content, className, image }: Props) {
  return (
    <div className={`slider-card ${className ? className : ""}`}>
      <img  src={image} className="slider-card-img"/>
      <div className="slider-card-header">{title}</div>
      <div className="slider-card-body">{content}</div>
    </div>
  );
}

export default SliderCard;
