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
import { THEME } from "../../styles/theme";

const COLORS = THEME.colors;
const RADIUS = THEME.radius;

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

  // Цвет аватарки в зависимости от типа жилья (Терракота и Северные акценты)
  const avatarColor =
    housingTypeValue === "МКД"
      ? COLORS.terracotta
      : housingTypeValue === "ИЖС"
        ? COLORS.northernAurora
        : housingTypeValue === "Блокированный"
          ? COLORS.warning
          : COLORS.primaryLight;

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
        style={{
          height: "100%",
          cursor: "pointer",
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.borderLight}`,
          boxShadow: COLORS.shadowSmall,
          transition: `all ${THEME.animation.fast}`,
        }}
        bodyStyle={{ padding: "16px" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = COLORS.terracotta;
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = COLORS.shadowMedium;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = COLORS.borderLight;
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = COLORS.shadowSmall;
        }}
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
              color: "#fff",
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
                color: COLORS.textPrimary,
              }}
            >
              {address}
            </div>
            <Space size={4} wrap>
              {housingTypeValue && (
                <Tag
                  style={{
                    margin: 0,
                    background:
                      housingTypeValue === "МКД"
                        ? "rgba(198, 123, 92, 0.1)"
                        : housingTypeValue === "ИЖС"
                          ? "rgba(91, 140, 90, 0.1)"
                          : "rgba(212, 149, 106, 0.1)",
                    color:
                      housingTypeValue === "МКД"
                        ? COLORS.terracotta
                        : housingTypeValue === "ИЖС"
                          ? COLORS.northernAurora
                          : COLORS.warning,
                    border: "none",
                    borderRadius: RADIUS.xs,
                    fontSize: 11,
                  }}
                >
                  {housingTypeValue}
                </Tag>
              )}
              {buildingTypeValue && (
                <Tag
                  icon={<HomeOutlined />}
                  style={{
                    margin: 0,
                    background: "rgba(92, 61, 46, 0.1)",
                    color: COLORS.primary,
                    border: "none",
                    borderRadius: RADIUS.xs,
                    fontSize: 11,
                  }}
                >
                  {buildingTypeValue}
                </Tag>
              )}
              {/* Статус аварийности */}
              <Tag
                style={{
                  margin: 0,
                  background: isEmergency
                    ? "rgba(184, 68, 58, 0.1)"
                    : "rgba(91, 140, 90, 0.1)",
                  color: isEmergency ? COLORS.danger : COLORS.success,
                  border: "none",
                  borderRadius: RADIUS.xs,
                  fontSize: 11,
                }}
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
            backgroundColor: COLORS.background,
            padding: "12px",
            borderRadius: RADIUS.sm,
            marginBottom: 8,
          }}
        >
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>Дом</div>
              <div style={{ fontWeight: 500, color: COLORS.textPrimary }}>
                {item["Номер дома"]
                  ? `№${item["Номер дома"]}`
                  : houseNumber !== "—"
                    ? `№${houseNumber}`
                    : "—"}
              </div>
            </Col>
            {area && (
              <Col span={12}>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  Площадь
                </div>
                <div style={{ fontWeight: 500, color: COLORS.textPrimary }}>
                  {area} м²
                </div>
              </Col>
            )}
            {floors && (
              <Col span={12}>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  Этажей
                </div>
                <div style={{ fontWeight: 500, color: COLORS.textPrimary }}>
                  {floors}
                </div>
              </Col>
            )}
            {buildYear && (
              <Col span={12}>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Год</div>
                <div style={{ fontWeight: 500, color: COLORS.textPrimary }}>
                  {buildYear}
                </div>
              </Col>
            )}
          </Row>
        </div>

        {/* Счетчики */}
        <Space size="large" style={{ marginTop: 8 }}>
          <span>
            <TeamOutlined
              style={{ marginRight: 4, color: COLORS.terracotta }}
            />
            <strong style={{ color: COLORS.textPrimary }}>{ownersCount}</strong>{" "}
            соб.
          </span>
          <span>
            <UserOutlined
              style={{ marginRight: 4, color: COLORS.northernAurora }}
            />
            <strong style={{ color: COLORS.textPrimary }}>
              {residentsCount}
            </strong>{" "}
            жит.
          </span>
        </Space>

        {/* Доп. информация */}
        <Space wrap size={[8, 4]} style={{ marginTop: 8 }}>
          {material && (
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
              🧱 {material}
            </span>
          )}
          {demolitionYear && (
            <Tooltip title="Год планируемого сноса">
              <Tag
                style={{
                  margin: 0,
                  background: "rgba(184, 68, 58, 0.1)",
                  color: COLORS.danger,
                  border: "none",
                  borderRadius: RADIUS.xs,
                  fontSize: 11,
                }}
              >
                <CalendarOutlined /> {formatDate(demolitionYear)}
              </Tag>
            </Tooltip>
          )}
        </Space>
      </Card>
    </Col>
  );
};
