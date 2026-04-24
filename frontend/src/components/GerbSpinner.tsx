import React from "react";
import "../Spinner.css";

type AnimationType =
  | "spin"
  | "pulse"
  | "breathe"
  | "bounce"
  | "wave"
  | "blink"
  | "spin3d";

interface GerbSpinnerProps {
  size?: number;
  animation?: AnimationType;
  text?: string;
}

export const GerbSpinner: React.FC<GerbSpinnerProps> = ({
  size = 64,
  animation = "pulse",
  text,
}) => {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        className={`gerb-${animation}`}
        style={{ width: size, height: size, margin: "0 auto" }}
      >
        <img
          src="/images/gerb.png"
          alt="Загрузка..."
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      {text && <p style={{ marginTop: 16, color: "#666" }}>{text}</p>}
    </div>
  );
};
