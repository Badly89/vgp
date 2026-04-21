// src/components/HousingModal.tsx
import React from "react";
import {
  Modal,
  Card,
  Descriptions,
  Space,
  Tag,
  Collapse,
  List,
  Avatar,
} from "antd";
import {
  HomeOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  UserOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

interface HousingModalProps {
  visible: boolean;
  onClose: () => void;
  housing: any;
  getAddress: (record: any) => string;
  formatDate: (dateStr: string) => string;
  formatRelativeDate: (dateStr: string) => string;
}

export const HousingModal: React.FC<HousingModalProps> = ({
  visible,
  onClose,
  housing,
  getAddress,
  formatDate,
  formatRelativeDate,
}) => {
  if (!housing) return null;

  // ✅ Исправлено: правильное имя поля
  const emergencyField = housing["Аварийный / не аварийный"];
  const isEmergency =
    emergencyField === true ||
    emergencyField === "Да" ||
    emergencyField === "да" ||
    emergencyField === "true";

  return (
    <Modal
      title={
        <Space>
          <HomeOutlined />
          <span>{getAddress(housing)}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card title="Основная информация" size="small">
          <Descriptions column={1} bordered size="small">
            {/* Адрес */}
            <Descriptions.Item label="Адрес">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  backgroundColor: "#f5f5f5",
                  padding: "12px 16px",
                  borderRadius: 8,
                }}
              >
                <EnvironmentOutlined
                  style={{
                    marginRight: 12,
                    color: "#1890ff",
                    fontSize: 18,
                    marginTop: 2,
                  }}
                />
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    wordBreak: "break-word",
                  }}
                >
                  {getAddress(housing)}
                </span>
              </div>
            </Descriptions.Item>

            {/* Характеристики */}
            <Descriptions.Item label="Характеристики">
              <Space size="large" wrap>
                {housing["Категория"] && (
                  <Tag
                    color={housing["Категория"] === "МКД" ? "blue" : "green"}
                  >
                    {housing["Категория"]}
                  </Tag>
                )}
                {housing["Площадь общая"] && (
                  <span>📐 Общая: {housing["Площадь общая"]} м²</span>
                )}
                {housing["Площадь"] && !housing["Площадь общая"] && (
                  <span>📐 Площадь: {housing["Площадь"]} м²</span>
                )}
                {housing["Этажность"] && (
                  <span>🏢 Этажей: {housing["Этажность"]}</span>
                )}
                {housing["Номер дома"] && (
                  <span>🚪 Дом №{housing["Номер дома"]}</span>
                )}
              </Space>
            </Descriptions.Item>

            {/* Годы */}
            <Descriptions.Item label="Годы">
              <Space size="large" wrap>
                {housing["Год постройки"] && (
                  <span>🏗️ Постройка: {housing["Год постройки"]}</span>
                )}
                {housing["Год ввода"] && (
                  <span>✅ Ввод: {housing["Год ввода"]}</span>
                )}
                {housing["Год планируемого сноса"] && (
                  <Tag color="red">
                    <CalendarOutlined /> Снос:{" "}
                    {housing["Год планируемого сноса"]}
                  </Tag>
                )}
                {housing["Срок сноса"] && (
                  <span>
                    ⏰ Срок: {formatRelativeDate(housing["Срок сноса"])}
                  </span>
                )}
              </Space>
            </Descriptions.Item>

            {/* Статус аварийности */}
            <Descriptions.Item label="Статус аварийности">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: isEmergency ? "#fff2f0" : "#f6ffed",
                  border: `1px solid ${isEmergency ? "#ffccc7" : "#b7eb8f"}`,
                  borderRadius: 8,
                  padding: "12px 16px",
                }}
              >
                {isEmergency ? (
                  <WarningOutlined
                    style={{ fontSize: 24, marginRight: 12, color: "#ff4d4f" }}
                  />
                ) : (
                  <CheckCircleOutlined
                    style={{ fontSize: 24, marginRight: 12, color: "#52c41a" }}
                  />
                )}
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: isEmergency ? "#ff4d4f" : "#52c41a",
                      fontSize: 16,
                    }}
                  >
                    {isEmergency ? "Аварийный дом" : "Не аварийный дом"}
                  </div>
                  <div style={{ color: "#8c8c8c", fontSize: 13 }}>
                    {isEmergency
                      ? "Требуется расселение"
                      : "Дом в нормальном состоянии"}
                  </div>
                </div>
              </div>
            </Descriptions.Item>

            {/* Состояние */}
            {(housing["Материал стен"] || housing["Состояние"]) && (
              <Descriptions.Item label="Состояние">
                <Space size="large" wrap>
                  {housing["Материал стен"] && (
                    <span>🧱 {housing["Материал стен"]}</span>
                  )}
                  {housing["Состояние"] && (
                    <Tag color="orange">{housing["Состояние"]}</Tag>
                  )}
                </Space>
              </Descriptions.Item>
            )}

            {/* Кадастровый номер */}
            {housing["Кадастровый номер"] && (
              <Descriptions.Item label="Кадастровый номер">
                {housing["Кадастровый номер"]}
              </Descriptions.Item>
            )}

            {/* НПА */}
            {housing["НПА"] && (
              <Descriptions.Item label="НПА">
                {housing["НПА"]}
              </Descriptions.Item>
            )}

            {/* Срок отселения */}
            {housing["Срок отселения"] && (
              <Descriptions.Item label="Срок отселения">
                <CalendarOutlined style={{ marginRight: 8 }} />
                {formatDate(housing["Срок отселения"])}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </Space>
    </Modal>
  );
};
