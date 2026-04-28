import { useState, useEffect } from "react";
import { dashboardApi } from "../services/api";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Statistic,
  Tag,
  Button,
} from "antd";
import {
  ApartmentOutlined,
  TeamOutlined,
  UserOutlined,
  ShopOutlined,
  SyncOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { THEME } from "../styles/theme";

const COLORS = THEME.colors;
const RADIUS = THEME.radius;

const { Title, Text } = Typography;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    total_housing: 0,
    total_owners: 0,
    total_residents: 0,
    total_organizations: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getSummary();
      if (data?.summary) {
        setSummary({
          total_housing: data.summary.total_housing || 0,
          total_owners: data.summary.total_owners || 0,
          total_residents: data.summary.total_residents || 0,
          total_organizations: data.summary.total_organizations || 0,
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
    } finally {
      setLoading(false);
    }
  };

  // Данные для карточек статистики
  const stats = [
    {
      key: "housing",
      title: "Жилой фонд",
      value: summary.total_housing,
      prefix: <ApartmentOutlined style={{ color: COLORS.terracotta }} />,
      suffix: (
        <Text style={{ fontSize: 14, color: COLORS.success }}>
          <RiseOutlined /> +4
        </Text>
      ),
      color: COLORS.terracotta,
      path: "/housing",
    },
    {
      key: "owners",
      title: "Собственники",
      value: summary.total_owners,
      prefix: <TeamOutlined style={{ color: COLORS.northernAurora }} />,
      suffix: (
        <Text style={{ fontSize: 14, color: COLORS.success }}>
          <RiseOutlined /> +12
        </Text>
      ),
      color: COLORS.northernAurora,
      path: "/owners",
    },
    {
      key: "residents",
      title: "Жители",
      value: summary.total_residents,
      prefix: <UserOutlined style={{ color: COLORS.northernBlue }} />,
      suffix: (
        <Text style={{ fontSize: 14, color: COLORS.danger }}>
          <FallOutlined /> -8
        </Text>
      ),
      color: COLORS.northernBlue,
      path: "/residents",
    },
    {
      key: "organizations",
      title: "Организации",
      value: summary.total_organizations,
      prefix: <ShopOutlined style={{ color: COLORS.primary }} />,
      suffix: (
        <Text style={{ fontSize: 14, color: COLORS.success }}>
          <RiseOutlined /> +1
        </Text>
      ),
      color: COLORS.primary,
      path: "/organizations",
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100vh",
        background: COLORS.background,
      }}
    >
      {/* Шапка с названием и синхронизацией */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <Space direction="vertical" size={0}>
          <Title level={3} style={{ margin: 0, color: COLORS.textPrimary }}>
            Реестр жилого фонда
          </Title>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
            мкр. Вынгапур •{" "}
            {new Date().toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </Space>

        <Space>
          <Tag
            icon={<ClockCircleOutlined />}
            style={{
              background: COLORS.background,
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.border}`,
              padding: "4px 12px",
              borderRadius: RADIUS.full,
            }}
          >
            Последняя синхронизация ~3 часа назад
          </Tag>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={() => navigate("/sync")}
            style={{
              background: COLORS.terracotta,
              borderColor: COLORS.terracotta,
              borderRadius: RADIUS.sm,
            }}
          >
            Обновить
          </Button>
        </Space>
      </div>

      {/* Карточки статистики */}
      <Row gutter={[24, 24]}>
        {stats.map((item) => (
          <Col xs={24} sm={12} md={12} lg={6} key={item.key}>
            <Card
              hoverable
              style={{
                height: "100%",
                borderRadius: RADIUS.lg,
                border: `1px solid ${COLORS.borderLight}`,
                boxShadow: COLORS.shadowSmall,
                transition: `all ${THEME.animation.fast}`,
                cursor: "pointer",
              }}
              styles={{ body: { padding: "20px 24px" } }}
              onClick={() => navigate(item.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = COLORS.shadowMedium;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.borderLight;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = COLORS.shadowSmall;
              }}
            >
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Text
                    style={{ color: COLORS.textSecondary, fontWeight: 500 }}
                  >
                    {item.title}
                  </Text>
                  <div
                    style={{
                      padding: 4,
                      borderRadius: 4,
                      background: `${item.color}15`, // 15% opacity
                    }}
                  >
                    {/* Пример графика (SVG line) */}
                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
                      <path
                        d="M0 15C5 15, 10 5, 15 10S25 18, 30 8S38 12, 40 10"
                        stroke={item.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </Space>

                <Statistic
                  value={item.value}
                  loading={loading}
                  prefix={item.prefix}
                  suffix={item.suffix}
                  valueStyle={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />

                <div style={{ marginTop: 8 }}>
                  <Button
                    type="link"
                    style={{
                      padding: 0,
                      height: "auto",
                      color: item.color,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(item.path);
                    }}
                  >
                    Подробнее <ArrowRightOutlined style={{ marginLeft: 4 }} />
                  </Button>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Дополнительный раздел (например, Дашборд или Быстрые действия) */}
      <Card
        title="Навигация по разделам"
        style={{
          marginTop: 24,
          borderRadius: RADIUS.lg,
          background: COLORS.surface,
          border: `1px solid ${COLORS.borderLight}`,
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6}>
            <div
              style={{
                padding: 16,
                borderRadius: RADIUS.md,
                background: COLORS.background,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => navigate("/dashboard")}
            >
              <DashboardOutlined
                style={{
                  fontSize: 24,
                  color: COLORS.primaryDark,
                  marginBottom: 8,
                }}
              />
              <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>
                Аналитика
              </div>
            </div>
          </Col>
          {/* Можно добавить другие быстрые действия */}
        </Row>
      </Card>

      {/* Футер */}
      <div
        style={{ textAlign: "center", marginTop: 48, color: COLORS.textMuted }}
      >
        <Text style={{ color: COLORS.textMuted }}>
          © {new Date().getFullYear()} • УИТиС
        </Text>
      </div>
    </div>
  );
};
