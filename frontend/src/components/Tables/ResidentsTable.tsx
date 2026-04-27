import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Avatar,
  Pagination,
  Spin,
  Empty,
  Tooltip,
  Radio,
  List,
  Drawer,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ManOutlined,
  WomanOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { ResidentModal } from "../Modals/ResidentModal";
import { GerbSpinner } from "../GerbSpinner";
import { residentsApi, ResidentItem } from "../../services/api";
import { ExportButton } from "../ExportButton";

const { Option } = Select;

export const ResidentsTable: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Группировка
  const urlGroupBy = searchParams.get("group") as "none" | "house" | null;
  const [groupBy, setGroupBy] = useState<"none" | "house">(
    urlGroupBy || "none",
  );

  // Данные
  const [data, setData] = useState<ResidentItem[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const [allResidentsData, setAllResidentsData] = useState<ResidentItem[]>([]);
  const [filteredAllData, setFilteredAllData] = useState<ResidentItem[]>([]);

  // Фильтры
  const [filterVisible, setFilterVisible] = useState(false); // ← Панель фильтров

  const [searchText, setSearchText] = useState("");
  const [gender, setGender] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [isChild, setIsChild] = useState<string>();
  const [vidFond, setVidFond] = useState<string>(); // ✅ Состояние

  // Списки для фильтров
  const [genders, setGenders] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Модальное окно
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Состояние
  const [privilege, setPrivilege] = useState<string>();
  const [privileges, setPrivileges] = useState<string[]>([]);

  // Форматирование даты
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Получение ФИО
  const getFullName = (record: any): string => {
    return record["ФИО"] || record["ФИО жителя"] || "Не указано";
  };

  // Получение адреса
  const getAddress = (record: any): string => {
    const addrField = record["Почтовый адрес"];
    if (Array.isArray(addrField) && addrField.length > 0) {
      return addrField[0]?.display_value || "Без адреса";
    }
    return "Без адреса";
  };

  // Определение пола
  const getGender = (record: any): string | null => {
    if (record["Пол"]) return record["Пол"];
    const name = getFullName(record).toLowerCase();
    if (name.includes("кызы") || name.includes("вна")) return "Женский";
    if (name.includes("оглы") || name.includes("вич")) return "Мужской";
    return null;
  };

  // Проверка аварийности
  const isEmergency = (record: any): boolean => {
    const value = record["Аварийный дом"];
    if (Array.isArray(value)) return value[0] === true;
    return value === true || value === "Да" || value === "да";
  };

  // Загрузка фильтров
  const loadFilterOptions = async () => {
    try {
      const response = await residentsApi.getList({ page: 1, page_size: 5000 });
      const rows = response.data || [];
      const genderSet = new Set<string>();
      const categorySet = new Set<string>();
      rows.forEach((item: any) => {
        if (item["Пол"]) genderSet.add(String(item["Пол"]));
        if (item["Категория"]) categorySet.add(String(item["Категория"]));
      });
      setGenders(Array.from(genderSet).sort());
      setCategories(Array.from(categorySet).sort());
    } catch (error) {
      console.error("Ошибка загрузки фильтров:", error);
    }
  };

  // Загрузка данных
  const loadData = async () => {
    setLoading(true);
    try {
      if (groupBy === "house") {
        // Группировка по домам
        const response = await residentsApi.getList({
          page: 1,
          page_size: 5000,
          search: searchText || undefined,
          gender: gender || undefined,
          category: category || undefined,
          is_child: isChild || undefined,
          vid_fond: vidFond || undefined, // ✅ Передаем
          privilege: privilege || undefined, // ← ДОБАВИТЬ
        });

        const residents = response.data || [];

        // Группируем
        const houseMap = new Map<string, any>();

        residents.forEach((r: any) => {
          const address = getAddress(r);
          let houseNumber = "—";
          const houseField = r["№ дома"];
          if (Array.isArray(houseField) && houseField.length > 0) {
            houseNumber = String(houseField[0]);
          } else if (houseField) {
            houseNumber = String(houseField);
          }

          const key = `${address}|${houseNumber}`;

          if (!houseMap.has(key)) {
            houseMap.set(key, {
              address,
              house_number: houseNumber,
              total_residents: 0,
              adults_count: 0,
              children_count: 0,
              apartments: new Set(),
              is_emergency: false,
            });
          }

          const house = houseMap.get(key);
          house.total_residents++;

          const isChildResident =
            r["Ребенок"] === "Да" || r["Ребенок"] === true;
          if (isChildResident) {
            house.children_count++;
          } else {
            house.adults_count++;
          }

          const apartment = r["Квартира"] || r["№ квартиры"] || "—";
          house.apartments.add(apartment);

          if (isEmergency(r)) {
            house.is_emergency = true;
          }
        });

        const houses: any[] = [];
        houseMap.forEach((house) => {
          houses.push({
            ...house,
            apartments: house.apartments.size,
          });
        });

        // Сортируем
        houses.sort((a, b) => {
          const addrCompare = a.address.localeCompare(b.address, "ru");
          if (addrCompare !== 0) return addrCompare;
          return (
            (parseInt(a.house_number) || 0) - (parseInt(b.house_number) || 0)
          );
        });

        setAllData(houses);
        setTotal(houses.length);
        setData([]);
      } else {
        // Обычный список
        const response = await residentsApi.getList({
          page,
          page_size: pageSize,
          search: searchText || undefined,
          gender: gender || undefined,
          category: category || undefined,
          is_child: isChild || undefined,
          vid_fond: vidFond || undefined, // ✅ Передаем
          privilege: privilege || undefined, // ← ДОБАВИТЬ
        });

        setData(response.data || []);
        setTotal(response.total || 0);

        // ✅ Сохраняем ВСЕ данные для экспорта
        if (
          page === 1 &&
          !searchText &&
          !gender &&
          !category &&
          !isChild &&
          !vidFond
        ) {
          // Загружаем все данные одним запросом для экспорта
          loadAllDataForExport();
        }
      }

      if (genders.length === 0) {
        await loadFilterOptions();
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка списка льгот
  const loadPrivileges = async () => {
    try {
      // Используем SQL для получения уникальных значений из массива
      const response = await residentsApi.getList({ page: 1, page_size: 5000 });
      const rows = response.data || [];
      const privilegeSet = new Set<string>();

      rows.forEach((item: any) => {
        const val = item["Льготные категории"];
        if (val && Array.isArray(val)) {
          val.forEach((v) => {
            const str = String(v).replace(/^"|"$/g, ""); // Убираем кавычки
            if (str && str !== "null") privilegeSet.add(str);
          });
        } else if (val && typeof val === "string") {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              parsed.forEach((v) => {
                if (v && v !== "null") privilegeSet.add(String(v));
              });
            }
          } catch {
            if (val !== "null") privilegeSet.add(val);
          }
        }
      });

      setPrivileges(Array.from(privilegeSet).sort());
    } catch (error) {}
  };

  const loadAllDataForExport = async () => {
    try {
      let allData: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await residentsApi.getList({
          page,
          page_size: 100, // Используем разрешенный лимит
          search: searchText || undefined,
          gender: gender || undefined,
          category: category || undefined,
          is_child: isChild || undefined,
          vid_fond: vidFond || undefined,
        });

        const rows = response.data || [];
        allData = [...allData, ...rows];

        if (rows.length < 100 || allData.length >= response.total) {
          hasMore = false;
        } else {
          page++;
        }
      }

      setAllResidentsData(allData);
    } catch (error) {}
  };

  const loadFilteredDataForExport = async () => {
    try {
      // Если фильтры не заданы — используем текущие данные
      if (
        !searchText &&
        !gender &&
        !category &&
        !isChild &&
        !vidFond &&
        !privilege
      ) {
        setFilteredAllData(data);
        return;
      }

      // Загружаем все данные с текущими фильтрами
      let allData: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await residentsApi.getList({
          page,
          page_size: 100,
          search: searchText || undefined,
          gender: gender || undefined,
          category: category || undefined,
          is_child: isChild || undefined,
          vid_fond: vidFond || undefined,
          privilege: privilege || undefined, // ← ДОБАВЛЕНО
        });

        const rows = response.data || [];
        allData = [...allData, ...rows];

        // Останавливаемся, когда получили меньше записей, чем размер страницы
        if (rows.length < 100 || allData.length >= response.total) {
          hasMore = false;
        } else {
          page++;
        }
      }

      setFilteredAllData(allData);
    } catch (error) {
      setFilteredAllData(data); // Fallback на текущую страницу
    }
  };

  useEffect(() => {
    loadData();
    loadFilteredDataForExport();
    loadPrivileges(); // ← ДОБАВИТЬ
  }, [page, pageSize, groupBy, gender, category, isChild, vidFond, privilege]);

  useEffect(() => {
    // Если открыли из HousingDrawer — включаем группировку по домам
    if (window.location.pathname.includes("/residents/house/")) {
      setGroupBy("house");
    }
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setSearchText("");
    setGender(undefined);
    setCategory(undefined);
    setIsChild(undefined);
    setVidFond(undefined);
    setPrivilege(undefined); // ← ДОБАВИТЬ
    setPage(1);
    loadData();
  };

  // Рендер карточки жителя
  const renderResidentCard = (item: ResidentItem) => {
    const fullName = getFullName(item);
    const address = getAddress(item);
    const age = item["Возраст (числом)"] || item["Возраст"];
    const genderValue = getGender(item);
    const phone = item["Телефон"];
    const categoryValue = item["Категория"];
    const isChildValue = item["Ребенок"] === "Да" || item["Ребенок"] === true;
    const apartment = item["Квартира"] || item["№ квартиры"];
    const houseNumber = item["№ дома"];

    return (
      <Col xs={24} sm={12} md={8} lg={6} xl={6} key={item._id}>
        <Card
          hoverable
          onClick={() => {
            setSelectedResident(item);
            setModalVisible(true);
          }}
          style={{
            height: "100%",
            cursor: "pointer",
          }}
          styles={{
            body: { padding: "16px", border: "4px", borderBlock: "2px" },
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <Avatar
              size={56}
              icon={
                genderValue === "Женский" ? <WomanOutlined /> : <ManOutlined />
              }
              style={{
                backgroundColor:
                  genderValue === "Женский" ? "#eb2f96" : "#1890ff",
                marginRight: 12,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  marginBottom: 4,
                  wordBreak: "break-word",
                }}
              >
                {fullName}
              </div>
              <Space size={4} wrap>
                {genderValue && (
                  <Tag color={genderValue === "Женский" ? "pink" : "blue"}>
                    {genderValue}
                  </Tag>
                )}
                {isChildValue && <Tag color="orange">Ребенок</Tag>}
                {categoryValue && <Tag color="cyan">{categoryValue}</Tag>}
              </Space>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "12px",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                marginBottom: 4,
              }}
            >
              <EnvironmentOutlined
                style={{ color: "#1890ff", marginRight: 8, marginTop: 3 }}
              />
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 13,
                  wordBreak: "break-word",
                }}
              >
                {address}
              </span>
            </div>
            {houseNumber && (
              <div style={{ marginTop: 4, marginLeft: 24 }}>
                <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                  🏠 Дом №{houseNumber}
                </span>
              </div>
            )}
            {apartment && (
              <div style={{ marginTop: 4, marginLeft: 24 }}>
                <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                  🚪 Кв. {apartment}
                </span>
              </div>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div style={{ padding: "0 24px" }}>
      {/* Верхняя панель */}
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
            <Tag color="blue" style={{ fontSize: 14, padding: "4px 16px" }}>
              👥 {groupBy === "house" ? "Всего домов" : "Всего жителей"}:{" "}
              {total}
            </Tag>
            {/* Активные фильтры тегами */}
            {searchText && (
              <Tag
                closable
                onClose={() => {
                  setSearchText("");
                  setPage(1);
                }}
              >
                🔍 {searchText}
              </Tag>
            )}
            {gender && (
              <Tag closable onClose={() => setGender(undefined)} color="pink">
                {gender}
              </Tag>
            )}
            {category && (
              <Tag closable onClose={() => setCategory(undefined)} color="cyan">
                {category}
              </Tag>
            )}
            {isChild && (
              <Tag
                closable
                onClose={() => setIsChild(undefined)}
                color="orange"
              >
                {isChild === "yes" ? "Ребенок" : "Не ребенок"}
              </Tag>
            )}
            {vidFond && (
              <Tag closable onClose={() => setVidFond(undefined)} color="green">
                {vidFond}
              </Tag>
            )}
            {privilege && (
              <Tag
                closable
                onClose={() => setPrivilege(undefined)}
                color="gold"
              >
                {privilege}
              </Tag>
            )}
          </Space>

          <Space>
            <Tooltip title="Фильтры">
              <Button
                icon={<FilterOutlined />}
                type={
                  searchText ||
                  gender ||
                  category ||
                  isChild ||
                  vidFond ||
                  privilege
                    ? "primary"
                    : "default"
                }
                onClick={() => setFilterVisible(true)}
              />
            </Tooltip>
            <Radio.Group
              value={groupBy}
              onChange={(e) => {
                setGroupBy(e.target.value);
                setPage(1);
                setSearchParams({ group: e.target.value });
              }}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="none">Без группировки</Radio.Button>
              <Radio.Button value="house">По домам</Radio.Button>
            </Radio.Group>
            <ExportButton
              data={filteredAllData.length > 0 ? filteredAllData : data}
              title={
                searchText ||
                gender ||
                category ||
                isChild ||
                vidFond ||
                privilege
                  ? "Жители (отфильтровано)"
                  : "Жители"
              }
              filename="residents_export"
              columns={[
                { key: "ФИО", label: "ФИО" },
                { key: "Пол", label: "Пол" },
                { key: "Возраст (числом)", label: "Возраст" },
                { key: "Категория", label: "Категория" },
                { key: "Телефон", label: "Телефон" },
                { key: "Вид фонда", label: "Вид фонда" },
                { key: "Льготные категории", label: "Льготные категории" },
              ]}
              disabled={loading}
            />
          </Space>
        </Space>
      </Card>

      {/* Выдвижная панель фильтров */}
      <Drawer
        title="🔍 Фильтры жителей"
        placement="right"
        width={400}
        open={filterVisible}
        onClose={() => setFilterVisible(false)}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Input
            placeholder="Поиск по ФИО, адресу, телефону..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            size="large"
            allowClear
          />
          <Select
            placeholder="Пол"
            value={gender}
            onChange={setGender}
            style={{ width: "100%" }}
            size="large"
            allowClear
          >
            {genders.map((g) => (
              <Option key={g} value={g}>
                {g}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Категория"
            value={category}
            onChange={setCategory}
            style={{ width: "100%" }}
            size="large"
            allowClear
          >
            {categories.map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Ребенок"
            value={isChild}
            onChange={setIsChild}
            style={{ width: "100%" }}
            size="large"
            allowClear
          >
            <Option value="yes">Да</Option>
            <Option value="no">Нет</Option>
          </Select>
          <Select
            placeholder="Вид фонда"
            value={vidFond}
            onChange={setVidFond}
            style={{ width: "100%" }}
            size="large"
            allowClear
          >
            <Option value="Коммерческий">Коммерческий</Option>
            <Option value="Специализированный">Специализированный</Option>
            <Option value="Маневренный">Маневренный</Option>
          </Select>
          <Select
            placeholder="Льготные категории"
            value={privilege}
            onChange={setPrivilege}
            style={{ width: "100%" }}
            size="large"
            allowClear
          >
            {privileges.map((p) => (
              <Option key={p} value={p}>
                {p}
              </Option>
            ))}
          </Select>
          <Space style={{ width: "100%" }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => {
                handleSearch();
                setFilterVisible(false);
              }}
              block
            >
              Применить
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                handleReset();
                setFilterVisible(false);
              }}
              block
            >
              Сбросить
            </Button>
          </Space>
        </Space>
      </Drawer>

      <Spin
        indicator={<GerbSpinner size={50} animation="spin3d" />}
        spinning={loading}
      >
        {groupBy === "house" ? (
          allData.length > 0 ? (
            <>
              <List
                dataSource={allData.slice(
                  (page - 1) * pageSize,
                  page * pageSize,
                )}
                renderItem={(house: any) => (
                  <List.Item
                    key={`${house.address}|${house.house_number}`}
                    style={{
                      padding: "16px 20px",
                      cursor: "pointer",
                      borderRadius: 8,
                      marginBottom: 8,
                      backgroundColor: "#fff",
                      border: "1px solid #f0f0f0",
                    }}
                    onClick={() =>
                      navigate(
                        `/residents/house/${encodeURIComponent(house.address)}/${encodeURIComponent(house.house_number)}`,
                      )
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={48}
                          icon={<HomeOutlined />}
                          style={{
                            backgroundColor: house.is_emergency
                              ? "#ff4d4f"
                              : "#1890ff",
                          }}
                        />
                      }
                      title={
                        <Space wrap>
                          <span style={{ fontWeight: 600, fontSize: 16 }}>
                            {house.address}
                          </span>
                          <Tag color="blue">Дом №{house.house_number}</Tag>
                          {house.is_emergency ? (
                            <Tag color="red">⚠️ Аварийный</Tag>
                          ) : (
                            <Tag color="green">✅ Не аварийный</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space size="large" style={{ marginTop: 8 }}>
                          <span>
                            <UserOutlined />{" "}
                            <strong>{house.total_residents}</strong> жителей
                          </span>
                          <span>
                            👤 <strong>{house.adults_count}</strong> взрослых
                          </span>
                          <span>
                            🧒 <strong>{house.children_count}</strong> детей
                          </span>
                          <span>
                            <HomeOutlined /> <strong>{house.apartments}</strong>{" "}
                            квартир
                          </span>
                        </Space>
                      }
                    />
                    <div style={{ color: "#1890ff", fontSize: 13 }}>
                      Нажмите для просмотра →
                    </div>
                  </List.Item>
                )}
              />
              <div style={{ marginTop: 24, textAlign: "center" }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(t) => `Всего ${t} домов`}
                  pageSizeOptions={["20", "50", "100"]}
                  onChange={(p, ps) => {
                    setPage(p);
                    setPageSize(ps || 20);
                  }}
                />
              </div>
            </>
          ) : (
            <Empty description="Нет данных" />
          )
        ) : data.length > 0 ? (
          <>
            <Row gutter={[16, 16]}>
              {data.map((item) => renderResidentCard(item))}
            </Row>
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                showQuickJumper
                showTotal={(t) => `Всего ${t} жителей`}
                pageSizeOptions={["24", "50", "100"]}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps || 24);
                }}
              />
            </div>
          </>
        ) : (
          <Empty description="Нет данных" />
        )}
      </Spin>

      <ResidentModal
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        resident={selectedResident}
        getFullName={getFullName}
        getAddress={getAddress}
        getGender={getGender}
        formatDate={formatDate}
        isEmergency={isEmergency}
        isNotEmergency={(r) => !isEmergency(r)}
      />
    </div>
  );
};
