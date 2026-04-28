import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  Input,
  Button,
  Space,
  Tag,
  Table,
  Spin,
  Empty,
  Tooltip,
  Drawer,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ArrowLeftOutlined,
  PercentageOutlined,
  FilterOutlined,
  RightOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { ownersApi, OwnerItem } from "../../services/api";
import { OwnerDrawer } from "../Drawers/OwnerDrawer";
import { GerbSpinner } from "../GerbSpinner";
import { ExportButton } from "../ExportButton";
import { THEME } from "../../styles/theme";

// Константы для удобства
const COLORS = THEME.colors;
const RADIUS = THEME.radius;

export const OwnersTable: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlAddress = searchParams.get("address") || "";
  const urlHouse = searchParams.get("house") || "";

  const [allData, setAllData] = useState<OwnerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [searchText, setSearchText] = useState(urlAddress || "");
  const [searchVisible, setSearchVisible] = useState(false);
  const [exportData, setExportData] = useState<any[]>([]);

  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // ✅ ВСЕ ФУНКЦИИ БЕЗ ИЗМЕНЕНИЙ
  const getAddress = (record: any): string => {
    if (record.address_display && record.address_display !== "Без адреса") {
      return record.address_display;
    }
    const addr = record["Почтовый адрес объекта"];
    if (Array.isArray(addr) && addr.length > 0) {
      return addr[0].display_value || "Без адреса";
    }
    if (addr && typeof addr === "object") {
      return addr.display_value || "Без адреса";
    }
    return "Без адреса";
  };

  const getHouseNumber = (record: any): string => {
    if (record.house_number) return record.house_number;
    const num = record["№ дома"] || record["Номер дома"];
    if (Array.isArray(num)) return String(num[0] || "—");
    return String(num || "—");
  };

  const getOwnershipColor = (type: string) => {
    if (!type) return COLORS.textMuted;
    const t = type.toLowerCase();
    // Муниципальная -> Северное небо (синий)
    if (t.includes("муниц")) return COLORS.northernBlue;
    // Частная -> Северное сияние (зеленый)
    if (t.includes("частн") || t.includes("приват"))
      return COLORS.northernAurora;
    // По умолчанию -> Терракота
    return COLORS.terracotta;
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      let allOwners: OwnerItem[] = [];
      let pageNum = 1;
      let hasMore = true;
      const searchQuery = urlAddress || searchText || undefined;

      while (hasMore) {
        const response = await ownersApi.getList({
          page: pageNum,
          page_size: 500,
          search: searchQuery,
        });
        if (response.data && response.data.length > 0) {
          allOwners = [...allOwners, ...response.data];
          pageNum++;
          if (response.data.length < 500) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      let filtered = allOwners;
      if (urlAddress && urlHouse) {
        filtered = allOwners.filter((owner: any) => {
          const ownerHouse =
            owner.house_number ||
            (Array.isArray(owner["№ дома"])
              ? String(owner["№ дома"][0])
              : String(owner["№ дома"] || ""));
          return ownerHouse === urlHouse;
        });
      }

      setAllData(filtered);
      setTotal(filtered.length);
    } catch (error) {
      console.error("Error loading data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadAllData();
  }, [searchText, urlAddress, urlHouse]);

  useEffect(() => {
    loadAllData();
  }, [page, pageSize]);

  const handleSearch = () => {
    if (searchText && !urlAddress) navigate("/owners");
    setPage(1);
    loadAllData();
  };

  const handleReset = () => {
    setSearchText("");
    setPage(1);
    navigate("/owners");
  };

  const showOwnerDetails = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setDrawerVisible(true);
  };

  const columns: ColumnsType<OwnerItem> = [
    {
      title: "ФИО / Наименование",
      key: "name",
      width: 250,
      render: (_: any, record: any) => (
        <a
          onClick={(e) => {
            e.stopPropagation();
            showOwnerDetails(record._id);
          }}
          style={{ fontWeight: 500, color: COLORS.textPrimary }}
        >
          <UserOutlined style={{ marginRight: 8, color: COLORS.terracotta }} />
          {record["ФИО"] || record["Наименование"] || "—"}
        </a>
      ),
    },
    {
      title: "Адрес объекта",
      key: "address",
      width: 280,
      render: (_: any, record: any) => (
        <Space>
          <EnvironmentOutlined style={{ color: COLORS.northernBlue }} />
          <span style={{ color: COLORS.textPrimary }}>
            {getAddress(record)}
            {getHouseNumber(record) !== "—" && `, д. ${getHouseNumber(record)}`}
          </span>
        </Space>
      ),
    },
    {
      title: "Вид собственности",
      dataIndex: "Вид собственности",
      key: "ownership_type",
      width: 160,
      render: (text: string) =>
        text ? (
          <Tag
            style={{
              background: getOwnershipColor(text),
              color: "#fff",
              border: "none",
              borderRadius: RADIUS.xs,
              fontSize: 12,
              padding: "2px 10px",
            }}
          >
            {text.length > 30 ? text.substring(0, 30) + "..." : text}
          </Tag>
        ) : (
          "—"
        ),
    },
    {
      title: "Доля",
      dataIndex: "Доля",
      key: "share",
      width: 120,
      render: (text: string) =>
        text ? (
          <Space>
            <PercentageOutlined style={{ color: COLORS.terracotta }} />
            <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>
              {text}
            </span>
          </Space>
        ) : (
          "—"
        ),
    },
    {
      title: "Квартира",
      key: "apartment",
      width: 100,
      render: (_: any, record: any) => {
        const apt = record["№ квартиры"] || record["Квартира"];
        return (
          <span style={{ color: COLORS.terracottaDark, fontWeight: 500 }}>
            {Array.isArray(apt) ? String(apt[0] || "—") : String(apt || "—")}
          </span>
        );
      },
    },
    {
      title: "Телефон",
      dataIndex: "Телефон",
      key: "phone",
      width: 150,
      render: (text: string) =>
        text ? (
          <Space>
            <PhoneOutlined style={{ color: COLORS.textSecondary }} />
            <span style={{ color: COLORS.textPrimary }}>{text}</span>
          </Space>
        ) : (
          "—"
        ),
    },
    {
      title: "ИНН",
      dataIndex: "ИНН",
      key: "inn",
      width: 130,
      render: (text: string) => (
        <span style={{ color: COLORS.textSecondary }}>{text || "—"}</span>
      ),
    },
  ];

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allData.slice(start, start + pageSize);
  }, [allData, page, pageSize]);

  return (
    <div
      style={{
        padding: "0 24px",
        background: COLORS.background,
        minHeight: "100vh",
      }}
    >
      {urlAddress && (
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            navigate("/owners");
            setSearchText("");
            setPage(1);
            setTimeout(() => loadAllData(), 100);
          }}
          style={{ marginBottom: 16, borderRadius: RADIUS.sm }}
        >
          Назад ко всем собственникам
          {searchParams.get("house") && ` (дом ${searchParams.get("house")})`}
        </Button>
      )}

      {/* Панель фильтров */}
      <Card
        size="small"
        className="top-panel"
        style={{
          marginBottom: 24,
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: COLORS.surface,
          border: `1px solid ${COLORS.borderLight}`,
          boxShadow: COLORS.shadowSmall,
          borderRadius: RADIUS.sm,
        }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space size="large">
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.textPrimary,
              }}
            >
              🏠 Собственники
            </span>
            <Tag
              style={{
                background: COLORS.terracotta,
                color: "#fff",
                border: "none",
                borderRadius: RADIUS.full,
                padding: "2px 12px",
                fontSize: 13,
              }}
            >
              {total}
            </Tag>
            {searchText && (
              <Tag
                closable
                onClose={() => {
                  setSearchText("");
                  loadAllData();
                }}
                style={{
                  background: COLORS.background,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.sm,
                  color: COLORS.textSecondary,
                }}
              >
                🔍 {searchText}
              </Tag>
            )}
          </Space>
          <Space>
            <Tooltip title="Поиск">
              <Button
                icon={<FilterOutlined />}
                type="text"
                onClick={() => setSearchVisible(true)}
                style={{
                  color: searchText ? COLORS.terracotta : COLORS.textSecondary,
                }}
              />
            </Tooltip>
            <ExportButton
              data={exportData.length > 0 ? exportData : allData}
              title={
                searchText ? "Собственники (отфильтровано)" : "Собственники"
              }
              filename="owners_all"
              columns={[
                { key: "ФИО", label: "ФИО" },
                { key: "Наименование", label: "Наименование" },
                { key: "Вид собственности", label: "Вид собственности" },
                { key: "Доля", label: "Доля" },
                { key: "Телефон", label: "Телефон" },
                { key: "Email", label: "Email" },
                { key: "ИНН", label: "ИНН" },
              ]}
              disabled={loading}
            />
          </Space>
        </Space>
      </Card>

      {/* Drawer поиска */}
      <Drawer
        title="🔍 Поиск собственников"
        placement="right"
        width={400}
        open={searchVisible}
        onClose={() => setSearchVisible(false)}
        style={{
          width: "100%",
          padding: "0 24px 24px 24px",
        }}
      >
        <Space
          direction="vertical"
          size="middle"
          style={{ width: THEME.sizes.filterDrawerInputWidth }}
        >
          <Input
            placeholder="Поиск по ФИО, адресу, телефону..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => {
              loadAllData();
              setSearchVisible(false);
            }}
            prefix={<SearchOutlined style={{ color: COLORS.textSecondary }} />}
            size="large"
            allowClear
            style={{
              borderRadius: RADIUS.sm,
              width: THEME.sizes.filterDrawerInputWidth,
            }}
          />
          <Space style={{ width: THEME.sizes.filterDrawerInputWidth }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => {
                handleSearch();
                setSearchVisible(false);
              }}
              block
              size="large"
              style={{
                background: COLORS.terracotta,
                borderColor: COLORS.terracotta,
                borderRadius: RADIUS.md,
                height: 44,
                fontWeight: 600,
              }}
            >
              Найти
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText("");
                navigate("/owners");
                setSearchVisible(false);
              }}
              block
              size="large"
              style={{ borderRadius: RADIUS.md, height: 44 }}
            >
              Сбросить
            </Button>
          </Space>
        </Space>
      </Drawer>

      {/* Таблица */}
      <Card
        styles={{ body: { padding: 0 } }}
        style={{
          borderRadius: RADIUS.lg,
          overflow: "hidden",
          border: `1px solid ${COLORS.borderLight}`,
          boxShadow: COLORS.shadowSmall,
        }}
      >
        <Spin
          indicator={<GerbSpinner size={50} animation="spin3d" />}
          spinning={loading}
        >
          {paginatedData.length > 0 ? (
            <Table
              columns={columns}
              dataSource={paginatedData}
              rowKey="_id"
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `Всего ${t} собственников`,
                pageSizeOptions: ["10", "20", "50", "100"],
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps || 20);
                },
              }}
              size="middle"
              rowClassName={(_, index) =>
                index % 2 === 0 ? "row-light" : "row-dark"
              }
              onRow={(record) => ({
                style: { cursor: "pointer" },
                onClick: () => showOwnerDetails(record._id),
              })}
            />
          ) : (
            <Empty description="Нет данных" style={{ padding: 48 }} />
          )}
        </Spin>
      </Card>

      {/* Футер */}
      <div
        style={{
          textAlign: "center",
          marginTop: 16,
          color: COLORS.textMuted,
          fontSize: 12,
        }}
      >
        Данные обновлены • {new Date().toLocaleDateString("ru-RU")} в{" "}
        {new Date().toLocaleTimeString("ru-RU")}
      </div>

      <OwnerDrawer
        visible={drawerVisible}
        ownerId={selectedOwnerId}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedOwnerId(null);
        }}
        getAddress={getAddress}
      />
    </div>
  );
};
