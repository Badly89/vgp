import React from "react";
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Card,
  Avatar,
  Divider,
  Empty,
} from "antd";
import {
  BankOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  IdcardOutlined,
  TeamOutlined,
  UserOutlined,
  CloseOutlined,
  CalendarOutlined,
  FileTextOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { THEME } from "../../styles/theme";

const COLORS = THEME.colors;
const RADIUS = THEME.radius;

interface OrganizationDrawerProps {
  visible: boolean;
  organization: any;
  onClose: () => void;
  getName: (r: any) => string;
  getAddress: (r: any) => string;
  formatValue: (v: any) => string;
}

export const OrganizationDrawer: React.FC<OrganizationDrawerProps> = ({
  visible,
  organization,
  onClose,
  getName,
  getAddress,
  formatValue,
}) => {
  if (!organization) return null;

  return (
    <Drawer
      placement="right"
      width={520}
      open={visible}
      onClose={onClose}
      closeIcon={<CloseOutlined style={{ color: COLORS.textSecondary }} />}
      styles={{ body: { padding: 0, background: COLORS.background } }}
      title={null}
    >
      <div style={{ minHeight: "100vh" }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #3B2417 0%, #5C3D2E 100%)",
            padding: "32px 24px 24px",
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  color: "#fff",
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 600,
                  wordBreak: "break-word",
                  lineHeight: 1.3,
                }}
              >
                {getName(organization)}
              </h2>
              <Space style={{ marginTop: 12 }} size={8} wrap>
                {organization["Вид организации"] && (
                  <Tag
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      color: "#fff",
                      border: "none",
                      borderRadius: RADIUS.xs,
                    }}
                  >
                    {organization["Вид организации"]}
                  </Tag>
                )}
                {organization["ИНН"] && (
                  <Tag
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      color: "#fff",
                      border: "none",
                      borderRadius: RADIUS.xs,
                    }}
                  >
                    ИНН: {organization["ИНН"]}
                  </Tag>
                )}
              </Space>
            </div>
            <Avatar
              size={64}
              icon={<BankOutlined />}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "3px solid rgba(255,255,255,0.3)",
                flexShrink: 0,
              }}
            />
          </div>
        </div>

        {/* Основная информация */}
        <Card
          style={{
            margin: "16px 16px 0",
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.borderLight}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: COLORS.textMuted,
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              fontWeight: 600,
            }}
          >
            Общая информация
          </div>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {getAddress(organization) !== "Без адреса" && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.xs,
                    background: COLORS.background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <EnvironmentOutlined
                    style={{ color: COLORS.terracotta, fontSize: 18 }}
                  />
                </div>
                <span style={{ color: COLORS.textPrimary, fontSize: 14 }}>
                  {getAddress(organization)}
                </span>
              </div>
            )}
            {organization["Телефон"] && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.xs,
                    background: COLORS.background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PhoneOutlined
                    style={{ color: COLORS.terracotta, fontSize: 18 }}
                  />
                </div>
                <span style={{ color: COLORS.textPrimary, fontSize: 14 }}>
                  {organization["Телефон"]}
                </span>
              </div>
            )}
            {organization["Email"] && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.xs,
                    background: COLORS.background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MailOutlined
                    style={{ color: COLORS.terracotta, fontSize: 18 }}
                  />
                </div>
                <span style={{ color: COLORS.textPrimary, fontSize: 14 }}>
                  {organization["Email"]}
                </span>
              </div>
            )}
            {organization["Сайт"] && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.xs,
                    background: COLORS.background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GlobalOutlined
                    style={{ color: COLORS.terracotta, fontSize: 18 }}
                  />
                </div>
                <span style={{ color: COLORS.textPrimary, fontSize: 14 }}>
                  {organization["Сайт"]}
                </span>
              </div>
            )}
          </Space>
        </Card>

        {/* Руководство */}
        <Card
          style={{
            margin: "12px 16px",
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.borderLight}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: COLORS.textMuted,
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              fontWeight: 600,
            }}
          >
            Руководство
          </div>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {organization["Руководитель"] && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                  Руководитель
                </span>
                <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>
                  {organization["Руководитель"]}
                </span>
              </div>
            )}
            {organization["Директор"] && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                  Директор
                </span>
                <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>
                  {organization["Директор"]}
                </span>
              </div>
            )}
            {organization["Количество работников"] && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                }}
              >
                <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                  Сотрудников
                </span>
                <Tag
                  style={{
                    background: COLORS.northernBlue,
                    color: "#fff",
                    border: "none",
                    borderRadius: RADIUS.xs,
                  }}
                >
                  <TeamOutlined style={{ marginRight: 4 }} />
                  {organization["Количество работников"]}
                </Tag>
              </div>
            )}
          </Space>
        </Card>

        {/* Документы */}
        <Card
          style={{
            margin: "12px 16px",
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.borderLight}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: COLORS.textMuted,
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              fontWeight: 600,
            }}
          >
            Документы
          </div>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {organization["ИНН"] && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                  ИНН
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    fontFamily: THEME.fonts.mono,
                  }}
                >
                  {organization["ИНН"]}
                </span>
              </div>
            )}
            {organization["КПП"] && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                  КПП
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    fontFamily: THEME.fonts.mono,
                  }}
                >
                  {organization["КПП"]}
                </span>
              </div>
            )}
            {organization["ОГРН"] && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                }}
              >
                <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                  ОГРН
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    fontFamily: THEME.fonts.mono,
                  }}
                >
                  {organization["ОГРН"]}
                </span>
              </div>
            )}
          </Space>
        </Card>
      </div>
    </Drawer>
  );
};
