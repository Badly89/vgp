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
  fullScreen?: boolean; // ← ДОБАВИТЬ
}

export const GerbSpinner: React.FC<GerbSpinnerProps> = ({
  size = 64,
  animation = "pulse",
  text,
  fullScreen = false,
}) => {
  const centerStyle: React.CSSProperties = fullScreen
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 250, 245, 0.8)", // полупрозрачный фон темы
        zIndex: 9999,
        flexDirection: "column",
      }
    : {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
        flexDirection: "column",
      };
  return (
    <div style={centerStyle}>
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
