import React from "react";
import { Layout, Menu, theme } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ShopOutlined,
  DashboardOutlined,
  BankOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: "Главная",
    },
    {
      key: "/housing",
      icon: <HomeOutlined />,
      label: "Жилой фонд",
    },
    {
      key: "/owners",
      icon: <TeamOutlined />,
      label: "Собственники",
    },
    {
      key: "/residents",
      icon: <UserOutlined />,
      label: "Жители",
    },
    {
      key: "/organizations",
      icon: <BankOutlined />,
      label: "Организации",
    },
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Аналитика",
      children: [
        {
          key: "/dashboard",
          label: "Конструктор",
        },
      ],
    },
    {
      key: "/sync",
      icon: <SyncOutlined />,
      label: "Синхронизация",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          background: "#001529",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          🏢 Реестр жилого фонда мкрн. Вынгапуровский
        </div>
      </Header>
      <Layout>
        <Sider
          width={250}
          style={{
            background: colorBgContainer,
            position: "sticky",
            top: 0,
            height: "100vh",
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
        <Layout style={{ padding: "24px" }}>
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
