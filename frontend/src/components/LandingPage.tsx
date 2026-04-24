import React from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Statistic,
  Tag,
  Divider,
} from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ShopOutlined,
  SyncOutlined,
  DashboardOutlined,
  ArrowRightOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "../LandingPage.css";

const { Title, Text, Paragraph } = Typography;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      key: "housing",
      title: "Жилой фонд",
      description:
        "Список домов, информация об объектах, аварийность, площадь и другие характеристики",
      icon: <HomeOutlined />,
      color: "#3f8600",
      bgColor: "#f6ffed",
      borderColor: "#b7eb8f",
      path: "/housing",
      stats: { label: "Объектов", value: "277" },
    },
    {
      key: "owners",
      title: "Собственники жилья",
      description:
        "Реестр собственников, доли, контактные данные, группировка по адресам",
      icon: <TeamOutlined />,
      color: "#1890ff",
      bgColor: "#e6f7ff",
      borderColor: "#91caff",
      path: "/owners",
    },
    {
      key: "residents",
      title: "Жители районов",
      description:
        "Список жителей, регистрация, состав семей, демографические данные",
      icon: <UserOutlined />,
      color: "#722ed1",
      bgColor: "#f9f0ff",
      borderColor: "#d3adf7",
      path: "/residents",
    },
    {
      key: "organizations",
      title: "Организации",
      description: "Список организаций, контакты, ИНН, виды деятельности",
      icon: <ShopOutlined />,
      color: "#fa8c16",
      bgColor: "#fff7e6",
      borderColor: "#ffd591",
      path: "/organizations",
    },
    {
      key: "dashboard",
      title: "Дашборд",
      description: "Аналитика, графики, статистика по всем разделам",
      icon: <DashboardOutlined />,
      color: "#eb2f96",
      bgColor: "#fff0f6",
      borderColor: "#ffadd6",
      path: "/dashboard",
    },
    {
      key: "sync",
      title: "Синхронизация",
      description: "Обновление данных из DTable, настройка расписания",
      icon: <SyncOutlined />,
      color: "#13c2c2",
      bgColor: "#e6fffb",
      borderColor: "#87e8de",
      path: "/sync",
    },
  ];

  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Шапка */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <Space direction="vertical" size="small">
          <Title level={1} style={{ margin: 0, fontSize: 48, fontWeight: 700 }}>
            <span
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {" "}
              <img
                src="/images/gerb.png"
                alt="Герб Вынгапур"
                style={{ width: "120px", height: "auto", marginBottom: "20px" }}
              />
            </span>
          </Title>
          <Title
            level={2}
            style={{ margin: 0, fontWeight: 400, color: "#666" }}
          >
            Реестр жилого фонда микрорайона Вынгапуровский
          </Title>
        </Space>
      </div>

      {/* Информационная карточка */}
      <Card
        style={{
          marginBottom: 32,
          maxWidth: 900,
          margin: "0 auto 32px",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <Row gutter={[24, 16]} justify="center">
          <Col>
            <Space size="large">
              <Space>
                <EnvironmentOutlined style={{ color: "#1890ff" }} />
                <Text>мкр. Вынгапур</Text>
              </Space>
              <Divider type="vertical" />
              <Space>
                <CalendarOutlined style={{ color: "#52c41a" }} />
                <Text>
                  {new Date().toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </Space>
              <Divider type="vertical" />
              <Space>
                <PhoneOutlined style={{ color: "#fa8c16" }} />
                <Text>+7 (3496) XX-XX-XX</Text>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Карточки разделов */}
      <Row gutter={[24, 24]} justify="center">
        {sections.map((section) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} key={section.key}>
            <Card
              hoverable
              className="section-card"
              style={{
                height: "100%",
                borderRadius: 16,
                borderColor: section.borderColor,
                borderWidth: 1,
                overflow: "hidden",
                transition: "all 0.3s",
                cursor: "pointer",
              }}
              styles={{ body: { padding: "24px 20px" } }}
              onClick={() => navigate(section.path)}
            >
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                {/* Анимированная иконка */}
                <div
                  className="icon-wrapper"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    background: section.bgColor,
                    borderRadius: "50%",
                    width: 100,
                    height: 100,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 48,
                    color: section.color,
                  }}
                >
                  {section.icon}
                </div>

                {/* Заголовок */}
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    textAlign: "center",
                    color: section.color,
                  }}
                >
                  {section.title}
                </Title>

                {/* Описание */}
                <Paragraph
                  style={{
                    textAlign: "center",
                    color: "#666",
                    minHeight: 60,
                    margin: 0,
                  }}
                >
                  {section.description}
                </Paragraph>

                {/* Кнопка */}
                <Button
                  type="primary"
                  block
                  size="large"
                  className="action-button"
                  style={{
                    marginTop: 8,
                    background: section.color,
                    border: "none",
                    borderRadius: 8,
                  }}
                  icon={<ArrowRightOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(section.path);
                  }}
                >
                  Перейти
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Футер */}
      <div style={{ textAlign: "center", marginTop: 48, color: "#8c8c8c" }}>
        <Text type="secondary">© 2026 • УИТиС</Text>
      </div>
    </div>
  );
};
