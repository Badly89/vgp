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
  Row,
  Col,
  Tooltip,
  Drawer,
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
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { ownersApi, OwnerItem } from "../../services/api";
import { OwnerDrawer } from "../Drawers/OwnerDrawer";
import { GerbSpinner } from "../GerbSpinner";
import { ExportButton } from "../ExportButton";

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
  const [searchVisible, setSearchVisible] = useState(false); // ← Панель поиска
  const [exportData, setExportData] = useState<any[]>([]);

  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const getAddress = (record: any): string => {
    // 1. Новое поле из БД (добавлено на бэкенде)
    if (record.address_display && record.address_display !== "Без адреса") {
      return record.address_display;
    }

    // 2. Из исходного JSON поля (если address_display не заполнено)
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
    // 1. Новое поле из БД
    if (record.house_number) return record.house_number;

    // 2. Из исходного поля
    const num = record["№ дома"] || record["Номер дома"];
    if (Array.isArray(num)) return String(num[0] || "—");
    return String(num || "—");
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

        console.log("API response total:", response.total); // ← ЛОГ

        if (response.data && response.data.length > 0) {
          allOwners = [...allOwners, ...response.data];
          pageNum++;
          if (response.data.length < 500) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      // Фильтрация по дому
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
    } finally {
      setLoading(false);
    }
  };

  // ПОИСК + URL — сбрасываем страницу и загружаем
  useEffect(() => {
    setPage(1);
    loadAllData();
  }, [searchText, urlAddress, urlHouse]);

  // ПАГИНАЦИЯ — только загружаем, не сбрасываем страницу
  useEffect(() => {
    loadAllData();
  }, [page, pageSize]);

  const handleSearch = () => {
    if (searchText && !urlAddress) {
      // Сбрасываем URL параметры при ручном поиске
      navigate("/owners");
    }
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
          style={{ fontWeight: 500 }}
        >
          <UserOutlined style={{ marginRight: 8, color: "#1890ff" }} />
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
          <EnvironmentOutlined style={{ color: "#1890ff" }} />
          <span>
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
      render: (text: string) => (text ? <Tag color="purple">{text}</Tag> : "—"),
    },
    {
      title: "Доля",
      dataIndex: "Доля",
      key: "share",
      width: 120,
      render: (text: string) =>
        text ? (
          <Space>
            <PercentageOutlined />
            {text}
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
        if (Array.isArray(apt)) return String(apt[0] || "—");
        return String(apt || "—");
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
            <PhoneOutlined />
            {text}
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
      render: (text: string) => text || "—",
    },
  ];

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allData.slice(start, start + pageSize);
  }, [allData, page, pageSize]);

  return (
    <div style={{ padding: "0 24px" }}>
      {urlAddress && (
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            navigate("/owners");
            setSearchText("");
            setPage(1); // Сбрасываем страницу
            setTimeout(() => {
              loadAllData();
            }, 100);
          }}
          style={{ marginBottom: 16 }}
        >
          Назад ко всем собственникам
          {searchParams.get("house") && ` (дом ${searchParams.get("house")})`}
        </Button>
      )}

      {/* Панель фильтров */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <Tag icon={<TeamOutlined />} color="green">
              Собственников: {total}
            </Tag>
            {searchText && (
              <Tag
                closable
                onClose={() => {
                  setSearchText("");
                  loadAllData();
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
                type={searchText ? "primary" : "default"}
                onClick={() => setSearchVisible(true)}
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

      <Drawer
        title="🔍 Поиск собственников"
        placement="right"
        width={400}
        open={searchVisible}
        onClose={() => setSearchVisible(false)}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Input
            placeholder="Поиск по ФИО, адресу, телефону..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => {
              loadAllData();
              setSearchVisible(false);
            }}
            prefix={<SearchOutlined />}
            size="large"
            allowClear
          />
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => {
                handleSearch();
                setSearchVisible(false);
              }}
              block
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
            >
              Сбросить
            </Button>
          </Space>
        </Space>
      </Drawer>

      {/* Таблица */}
      <Card
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: 12, overflow: "hidden" }}
      >
        <Spin
          indicator={<GerbSpinner size={120} animation="pulse" />}
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
          color: "#8c8c8c",
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
