import React, { useState } from "react";
import { Layout, Menu, Button, theme } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ShopOutlined,
  DashboardOutlined,
  SyncOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    { key: "/housing", icon: <HomeOutlined />, label: "Жилой фонд" },
    { key: "/owners", icon: <TeamOutlined />, label: "Собственники" },
    { key: "/residents", icon: <UserOutlined />, label: "Жители" },
    { key: "/organizations", icon: <ShopOutlined />, label: "Организации" },
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Дашборд" },
    { key: "/sync", icon: <SyncOutlined />, label: "Синхронизация" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Header */}
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          background: "#001529",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{ fontSize: "16px", width: 48, height: 48, color: "#fff" }}
        />
        <div
          style={{
            color: "#fff",
            fontSize: collapsed ? "0" : "18px",
            fontWeight: "bold",
            marginLeft: collapsed ? 0 : 16,
            transition: "all 0.3s",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          🏢 Реестр жилого фонда
        </div>
      </Header>

      <Layout>
        {/* Sidebar */}
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={220}
          style={{
            background: colorBgContainer,
            position: "sticky",
            top: 64,
            height: "calc(100vh - 64px)",
            overflow: "auto",
            borderRight: "1px solid #f0f0f0",
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: "100%", borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>

        {/* Content */}
        <Layout style={{ padding: collapsed ? "24px 16px" : "24px" }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
