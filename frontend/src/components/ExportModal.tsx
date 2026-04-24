import React from "react";
import { Modal, Progress, Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { GerbSpinner } from "./GerbSpinner";

const { Text } = Typography;

interface ExportModalProps {
  visible: boolean;
  progress: number;
  message: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  progress,
  message,
}) => {
  return (
    <Modal
      open={visible}
      closable={false}
      footer={null}
      width={400}
      centered
      title={null}
    >
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <GerbSpinner size={100} animation="breathe" />

        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <Text strong style={{ fontSize: 16 }}>
            {message}
          </Text>
        </div>

        <Progress
          percent={progress}
          status="active"
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
        />

        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Пожалуйста, подождите...
          </Text>
        </div>
      </div>
    </Modal>
  );
};
