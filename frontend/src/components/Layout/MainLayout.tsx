import React, { useState } from "react";
import { Layout, Menu, Button, Avatar, Space, Typography } from "antd";
import {
  ApartmentOutlined,
  TeamOutlined,
  UserOutlined,
  ShopOutlined,
  DashboardOutlined,
  SyncOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  UserSwitchOutlined, // Для профиля
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { THEME } from "../../styles/theme";

const COLORS = THEME.colors;
const RADIUS = THEME.radius;
const SIZES = THEME.sizes;

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: "/", icon: <HomeOutlined />, label: "Главная" },
    { key: "/housing", icon: <ApartmentOutlined />, label: "Жилой фонд" },
    { key: "/owners", icon: <TeamOutlined />, label: "Собственники" },
    { key: "/residents", icon: <UserOutlined />, label: "Жители" },
    { key: "/organizations", icon: <ShopOutlined />, label: "Организации" },
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Аналитика" },
    { key: "/sync", icon: <SyncOutlined />, label: "Синхронизация" },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: COLORS.background }}>
      <Layout hasSider>
        {/* Sidebar */}
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={SIZES.sidebarWidth} // 240px
          collapsedWidth={SIZES.sidebarCollapsed} // 64px
          style={{
            background: COLORS.surface,
            overflow: "hidden",
            height: "100vh",
            position: "fixed", // Фиксируем слева
            left: 0,
            top: 0,
            boxShadow: COLORS.shadowMedium, // Тень справа
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Верхняя часть меню с названием и кнопкой */}
          <div
            style={{
              height: SIZES.headerHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              padding: collapsed ? 0 : "0 16px",
              borderBottom: `1px solid ${COLORS.borderLight}`,
              flexShrink: 0,
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "18px",
                width: 40,
                height: 40,
                color: COLORS.textPrimary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />

            {/* Название меню */}
            {!collapsed && (
              <Space direction="vertical" size={0} style={{ marginLeft: 12 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: COLORS.textMuted,
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  Реестр жилого фонда
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: COLORS.terracotta,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Мкр. Вынгапуровский
                </Text>
              </Space>
            )}
          </div>

          {/* Само меню */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              width: "100%",
              paddingTop: 16,
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 15,
              }}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
            />
          </div>

          {/* Нижняя часть меню (профиля) - опционально, но выглядит красиво */}
          {/* <div
            style={{
              padding: "16px",
              borderTop: `1px solid ${COLORS.borderLight}`,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              cursor: "pointer",
            }}
          >
            <Avatar
              size={32}
              style={{ backgroundColor: COLORS.terracotta }}
              icon={<UserSwitchOutlined />}
            />
            {!collapsed && (
              <div style={{ marginLeft: 12 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    display: "block",
                  }}
                >
                  Администратор
                </Text>
              </div>
            )}
          </div> */}
        </Sider>

        {/* Основной контент */}
        <Layout
          style={{
            marginLeft: collapsed ? SIZES.sidebarCollapsed : SIZES.sidebarWidth,
            transition: "margin-left 0.2s", // Плавный сдвиг
          }}
        >
          <Content
            style={{
              padding: 0,
              margin: 0,
              minHeight: "100vh",
              background: COLORS.background,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
