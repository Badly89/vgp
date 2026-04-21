// src/components/HousingCard.tsx
import React from "react";
import { Card, Tag, Space, Row, Col, Avatar, Tooltip } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

interface HousingCardProps {
  item: any;
  onShowDetails: (id: string) => void;
  getAddress: (record: any) => string;
  getHouseNumber: (record: any) => string;
  getResidentsCount: (record: any) => number;
  getOwnersCount: (record: any) => number;
  formatDate: (dateStr: string) => string;
}

export const HousingCard: React.FC<HousingCardProps> = ({
  item,
  onShowDetails,
  getAddress,
  getHouseNumber,
  getResidentsCount,
  getOwnersCount,
  formatDate,
}) => {
  const address = getAddress(item);
  const houseNumber = getHouseNumber(item);
  const residentsCount = getResidentsCount(item);
  const ownersCount = getOwnersCount(item);
  const area = item["Площадь общая"] || item["Площадь"];
  const floors = item["Этажность"] || item["Количество этажей"];
  const buildYear = item["Год постройки"] || item["Год ввода"];
  const material = item["Материал стен"];
  const demolitionYear = item["Год планируемого сноса"];
  const housingTypeValue = item["Категория"] || item["Вид жилья"];
  const buildingTypeValue = item["Тип здания"] || item["Тип объекта"];
  const emergencyField = item["Аварийный / не аварийный"];

  // Статус аварийности - Boolean
  const isEmergency =
    emergencyField === true ||
    emergencyField === "Да" ||
    emergencyField === "да" ||
    emergencyField === "true";

  // Цвет аватарки в зависимости от типа жилья
  const avatarColor =
    housingTypeValue === "МКД"
      ? "#1890ff"
      : housingTypeValue === "ИЖС"
        ? "#52c41a"
        : housingTypeValue === "Блокированный"
          ? "#faad14"
          : "#1890ff";

  const avatarIcon =
    housingTypeValue === "МКД"
      ? "🏢"
      : housingTypeValue === "ИЖС"
        ? "🏠"
        : housingTypeValue === "Блокированный"
          ? "🏘️"
          : "🏠";

  return (
    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
      <Card
        hoverable
        onClick={() => onShowDetails(item._id)}
        style={{ height: "100%", cursor: "pointer" }}
        bodyStyle={{ padding: "16px" }}
      >
        {/* Заголовок с адресом */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <Avatar
            size={48}
            style={{
              backgroundColor: avatarColor,
              marginRight: 12,
              flexShrink: 0,
              fontSize: 24,
            }}
          >
            {avatarIcon}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 15,
                marginBottom: 4,
                wordBreak: "break-word",
              }}
            >
              {address}
            </div>
            <Space size={4} wrap>
              {housingTypeValue && (
                <Tag
                  color={
                    housingTypeValue === "МКД"
                      ? "blue"
                      : housingTypeValue === "ИЖС"
                        ? "green"
                        : "gold"
                  }
                >
                  {housingTypeValue}
                </Tag>
              )}
              {buildingTypeValue && (
                <Tag color="purple" icon={<HomeOutlined />}>
                  {buildingTypeValue}
                </Tag>
              )}
              {/* Статус аварийности */}
              <Tag
                color={isEmergency ? "red" : "green"}
                icon={
                  isEmergency ? <WarningOutlined /> : <CheckCircleOutlined />
                }
              >
                {isEmergency ? "Аварийный" : "Не аварийный"}
              </Tag>
            </Space>
          </div>
        </div>

        {/* Характеристики */}
        <div
          style={{
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>Дом</div>
              <div style={{ fontWeight: 500 }}>
                {item["Номер дома"]
                  ? `№${item["Номер дома"]}`
                  : houseNumber !== "—"
                    ? `№${houseNumber}`
                    : "—"}
              </div>
            </Col>
            {area && (
              <Col span={12}>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>Площадь</div>
                <div style={{ fontWeight: 500 }}>{area} м²</div>
              </Col>
            )}
            {floors && (
              <Col span={12}>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>Этажей</div>
                <div style={{ fontWeight: 500 }}>{floors}</div>
              </Col>
            )}
            {buildYear && (
              <Col span={12}>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>Год</div>
                <div style={{ fontWeight: 500 }}>{buildYear}</div>
              </Col>
            )}
          </Row>
        </div>

        {/* Счетчики */}
        <Space size="large" style={{ marginTop: 8 }}>
          <span>
            <TeamOutlined style={{ marginRight: 4, color: "#1890ff" }} />
            <strong>{ownersCount}</strong> соб.
          </span>
          <span>
            <UserOutlined style={{ marginRight: 4, color: "#52c41a" }} />
            <strong>{residentsCount}</strong> жит.
          </span>
        </Space>

        {/* Доп. информация */}
        <Space wrap size={[8, 4]} style={{ marginTop: 8 }}>
          {material && (
            <span style={{ fontSize: 12, color: "#595959" }}>
              🧱 {material}
            </span>
          )}
          {demolitionYear && (
            <Tooltip title="Год планируемого сноса">
              <Tag color="red" style={{ margin: 0 }}>
                <CalendarOutlined /> {formatDate(demolitionYear)}
              </Tag>
            </Tooltip>
          )}
        </Space>
      </Card>
    </Col>
  );
};
