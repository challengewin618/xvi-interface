import Tooltip from "../Tooltip/Tooltip";
import "./Card.css";

function Card({ title, children, className, tooltipText, icon, subtitle }) {
  return (
    <div className={`card ${className ? className : ""}`}>
      {tooltipText ? (
        <Tooltip
          handle={<div className="card-header">{title}</div>}
          position="left-bottom"
          renderContent={() => tooltipText}
        />
      ) : (
        <div className="card-header">
          { icon ? (<img src={icon} width={48} height={48}/>) : (<></>) }
          <div className="card-title-group">
            <div className="card-title-first">{title}</div>
            <div className="card-title-second">{subtitle}</div>
          </div>
          
        </div>
      )}
      
      <div className="card-body">{children}</div>
    </div>
  );
}

export default Card;
