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
  Pagination,
  Spin,
  Empty,
  Radio,
  Drawer,
  Tooltip,
  Table,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  RightOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import { ResidentDrawer } from "../Drawers/ResidentDrawer";
import { GerbSpinner } from "../GerbSpinner";
import { residentsApi, ResidentItem, ownersApi } from "../../services/api";
import { ExportButton } from "../ExportButton";
import { THEME } from "../../styles/theme";

const COLORS = THEME.colors;
const RADIUS = THEME.radius;
// Используем фиксированную ширину для полей в Drawer
const FILTER_INPUT_WIDTH = 340;

const { Option } = Select;

export const ResidentsTable: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlGroupBy = searchParams.get("group") as "none" | "house" | null;
  const [groupBy, setGroupBy] = useState<"none" | "house">(
    urlGroupBy || "house",
  );

  const [data, setData] = useState<ResidentItem[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Фильтры
  const [searchText, setSearchText] = useState("");
  const [gender, setGender] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [isChild, setIsChild] = useState<string>();
  const [vidFond, setVidFond] = useState<string>();
  const [privilege, setPrivilege] = useState<string>();

  // Опции фильтров
  const [genders, setGenders] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [privileges, setPrivileges] = useState<string[]>([]);

  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

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

  const getFullName = (record: any): string => {
    return record["ФИО"] || record["ФИО жителя"] || "Не указано";
  };

  const getAddress = (record: any): string => {
    const addrField = record["Почтовый адрес"];
    if (Array.isArray(addrField) && addrField.length > 0) {
      return addrField[0]?.display_value || "Без адреса";
    }
    return "Без адреса";
  };

  const getGender = (record: any): string | null => {
    if (record["Пол"]) return record["Пол"];
    const name = getFullName(record).toLowerCase();
    if (name.includes("кызы") || name.includes("вна") || name.includes("чна"))
      return "Женский";
    if (name.includes("оглы") || name.includes("вич")) return "Мужской";
    return null;
  };

  const getAge = (record: any): number | null => {
    return record["Возраст (числом)"] || record["Возраст"] || null;
  };

  const getApartment = (record: any): string => {
    return record["№ квартиры"] || record["Квартира"] || "—";
  };

  const getPhone = (record: any): string => {
    return record["Телефон"] || "—";
  };

  const showDetails = (resident: any) => {
    setSelectedResident(resident);
    setDrawerVisible(true);
  };

  // Загрузка опций фильтров
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

      // Загрузка льгот (как в рабочем коде)
      const privilegeSet = new Set<string>();
      rows.forEach((item: any) => {
        const val = item["Льготные категории"];
        if (val && Array.isArray(val)) {
          val.forEach((v) => {
            const str = String(v).replace(/^"|"$/g, "");
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
    } catch (error) {
      console.error("Ошибка загрузки фильтров:", error);
    }
  };

  // Загрузка данных
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await residentsApi.getList({
        page: 1,
        page_size: 5000,
        search: searchText || undefined,
        gender: gender || undefined,
        category: category || undefined,
        is_child: isChild || undefined,
        vid_fond: vidFond || undefined,
        privilege: privilege || undefined,
      });

      const residents = response.data || [];

      if (groupBy === "house") {
        // Группировка по домам
        const houseMap = new Map<string, any>();

        // Загрузка собственников для проверки наличия муниципального фонда
        let ownersMap = new Map<string, boolean>();
        try {
          const ownersResponse = await ownersApi.getList({
            page: 1,
            page_size: 5000,
          });
          (ownersResponse.data || []).forEach((owner: any) => {
            if (
              owner["Муниципальный ж/ф, кол-во квартир"] > 0 ||
              owner["Муниципальный ж/ф, S квартир(м2)"] > 0
            ) {
              const addr = owner.address_display || "";
              const house =
                owner.house_number ||
                (Array.isArray(owner["№ дома"])
                  ? String(owner["№ дома"][0])
                  : "");
              const key = `${addr}|${house}`;
              ownersMap.set(key, true);
            }
          });
        } catch (e) {
          console.error("Ошибка загрузки собственников:", e);
        }

        residents.forEach((r: any) => {
          const address = getAddress(r);
          let houseNumber = "—";
          const houseField = r["№ дома"];

          // Проверка муниципального по жителю
          const isMunicipalResident =
            r["Муниципальный ж/ф, кол-во квартир"] > 0 ||
            r["Муниципальный"] === true;

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
              residents: [],
              total_residents: 0,
              hasMunicipal: false,
            });
          }
          const house = houseMap.get(key);
          house.residents.push(r);
          house.total_residents++;

          // Если в доме есть муниципальные квартиры у жителя ИЛИ у собственника
          if (isMunicipalResident || ownersMap.has(key)) {
            house.hasMunicipal = true;
          }
        });

        const houses: any[] = [];
        houseMap.forEach((house) => houses.push(house));

        // Сортировка
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
        // Список (таблица)
        setData(residents);
        setTotal(response.total || 0);
        setAllData([]);
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (genders.length === 0) loadFilterOptions();
  }, [page, pageSize, groupBy, gender, category, isChild, vidFond, privilege]);

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
    setPrivilege(undefined);
    setPage(1);
    loadData();
  };

  // Колонки для таблицы
  const columns = [
    {
      title: "ФИО",
      key: "fullName",
      width: 250,
      sorter: (a: any, b: any) =>
        getFullName(a).localeCompare(getFullName(b), "ru"),
      render: (_: any, record: any) => {
        const genderValue = getGender(record);
        const isChildValue =
          record["Ребенок"] === "Да" || record["Ребенок"] === true;
        const age = getAge(record);

        return (
          <a
            onClick={(e) => {
              e.stopPropagation();
              showDetails(record);
            }}
            style={{ fontWeight: 500, color: COLORS.textPrimary }}
          >
            <Space>
              {genderValue === "Женский" ? (
                <WomanOutlined style={{ color: COLORS.terracotta }} />
              ) : (
                <ManOutlined style={{ color: COLORS.northernBlue }} />
              )}
              <span>{getFullName(record)}</span>
              {age && (
                <Tag
                  style={{
                    background: COLORS.background,
                    color: COLORS.textSecondary,
                    border: "none",
                    borderRadius: RADIUS.xs,
                    fontSize: 11,
                    margin: 0,
                  }}
                >
                  {age} лет
                </Tag>
              )}
              {isChildValue && (
                <Tag
                  style={{
                    background: "rgba(212, 149, 106, 0.1)",
                    color: COLORS.warning,
                    border: "none",
                    borderRadius: RADIUS.xs,
                    fontSize: 11,
                    margin: 0,
                  }}
                >
                  👶 ребенок
                </Tag>
              )}
            </Space>
          </a>
        );
      },
    },
    {
      title: "Адрес",
      key: "address",
      width: 300,
      render: (_: any, record: any) => {
        const address = getAddress(record);
        const apartment = getApartment(record);
        return (
          <span style={{ color: COLORS.textSecondary }}>
            <EnvironmentOutlined
              style={{ marginRight: 6, color: COLORS.terracotta }}
            />
            {address}
            {apartment !== "—" && `, кв. ${apartment}`}
          </span>
        );
      },
    },

    {
      title: "Дата рождения",
      key: "birthDate",
      width: 120,
      render: (_: any, record: any) => {
        const birthDate = record["Дата рождения"];
        return birthDate ? (
          <span style={{ color: COLORS.textPrimary }}>
            <CalendarOutlined
              style={{ marginRight: 6, color: COLORS.terracotta }}
            />
            {formatDate(birthDate)}
          </span>
        ) : (
          <span style={{ color: COLORS.textMuted }}>—</span>
        );
      },
    },
    {
      title: "Категория",
      key: "category",
      width: 150,
      render: (_: any, record: any) => {
        const cat = record["Категория"] || record["Категория населения"];
        return cat ? (
          <Tag
            style={{
              background: COLORS.northernIce,
              color: COLORS.primaryDark,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.xs,
            }}
          >
            {cat}
          </Tag>
        ) : (
          <span style={{ color: COLORS.textMuted }}>—</span>
        );
      },
    },
    {
      title: "Льготы",
      key: "privilege",
      width: 150,
      render: (_: any, record: any) => {
        const priv = record["Льготная категория"];
        return priv ? (
          <Tag
            style={{
              background: COLORS.terracottaLight,
              color: COLORS.primaryDark,
              border: "none",
              borderRadius: RADIUS.xs,
            }}
          >
            {priv}
          </Tag>
        ) : (
          <span style={{ color: COLORS.textMuted }}>—</span>
        );
      },
    },
  ];

  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div
      style={{
        padding: "0 24px",
        background: COLORS.background,
        minHeight: "100vh",
      }}
    >
      {/* Верхняя панель */}
      <Card
        size="small"
        style={{
          marginBottom: 24,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: COLORS.surface,
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
              👥 {groupBy === "house" ? "Дома" : "Жители"}
            </span>
            <Tag
              style={{
                background: COLORS.terracotta,
                color: "#fff",
                border: "none",
                borderRadius: RADIUS.full,
                fontSize: 13,
                padding: "2px 12px",
              }}
            >
              {total}
            </Tag>
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
              <Radio.Button value="none">Списком</Radio.Button>
              <Radio.Button value="house">По домам</Radio.Button>
            </Radio.Group>
            <ExportButton
              data={data}
              title="Жители"
              filename="residents"
              columns={[
                { key: "ФИО", label: "ФИО" },
                { key: "Почтовый адрес", label: "Адрес" },
                { key: "Телефон", label: "Телефон" },
                { key: "Дата рождения", label: "Дата рождения" },
                { key: "Категория", label: "Категория" },
              ]}
              disabled={loading}
            />
          </Space>
        </Space>

        {/* Активные фильтры */}
        {(searchText ||
          gender ||
          category ||
          isChild ||
          vidFond ||
          privilege) && (
          <Space wrap style={{ marginTop: 12 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 13 }}>
              Активные фильтры:
            </span>
            {searchText && (
              <Tag
                closable
                onClose={() => {
                  setSearchText("");
                  handleSearch();
                }}
                style={{
                  background: COLORS.northernBlue,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.sm,
                }}
              >
                🔍 {searchText}
              </Tag>
            )}
            {gender && (
              <Tag
                closable
                onClose={() => {
                  setGender(undefined);
                  handleSearch();
                }}
                style={{
                  background: COLORS.terracotta,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.sm,
                }}
              >
                {gender === "Женский" ? "👩 Женский" : "👨 Мужской"}
              </Tag>
            )}
            {category && (
              <Tag
                closable
                onClose={() => {
                  setCategory(undefined);
                  handleSearch();
                }}
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.sm,
                }}
              >
                📋 {category}
              </Tag>
            )}
            {isChild && (
              <Tag
                closable
                onClose={() => {
                  setIsChild(undefined);
                  handleSearch();
                }}
                style={{
                  background: COLORS.warning,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.sm,
                }}
              >
                {isChild === "yes" ? "👶 Ребенок" : "👤 Взрослый"}
              </Tag>
            )}
            {vidFond && (
              <Tag
                closable
                onClose={() => {
                  setVidFond(undefined);
                  handleSearch();
                }}
                style={{
                  background: COLORS.northernAurora,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.sm,
                }}
              >
                🏢 {vidFond}
              </Tag>
            )}
            {privilege && (
              <Tag
                closable
                onClose={() => {
                  setPrivilege(undefined);
                  handleSearch();
                }}
                style={{
                  background: COLORS.terracottaDark,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.sm,
                }}
              >
                ⭐ {privilege}
              </Tag>
            )}
          </Space>
        )}
      </Card>

      <Spin
        indicator={<GerbSpinner size={100} animation="spin3d" fullScreen />}
        spinning={loading}
      >
        {groupBy === "house" ? (
          // Группировка по домам — карточки домов
          <div>
            {allData
              .slice((page - 1) * pageSize, page * pageSize)
              .map((house: any) => (
                <Card
                  key={`${house.address}|${house.house_number}`}
                  style={{
                    marginBottom: 16,
                    borderRadius: RADIUS.lg,
                    border: `1px solid ${COLORS.borderLight}`,
                    boxShadow: COLORS.shadowSmall,
                    cursor: "pointer",
                    transition: `all ${THEME.animation.fast}`,
                  }}
                  styles={{ body: { padding: "16px 20px" } }}
                  onClick={() =>
                    navigate(
                      `/residents/house/${encodeURIComponent(house.address)}/${encodeURIComponent(house.house_number)}`,
                    )
                  }
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: COLORS.textPrimary,
                          marginBottom: 4,
                        }}
                      >
                        <EnvironmentOutlined
                          style={{ marginRight: 8, color: COLORS.terracotta }}
                        />
                        {house.address}, {house.house_number}
                      </div>
                      <div
                        style={{ fontSize: 13, color: COLORS.textSecondary }}
                      >
                        {house.total_residents}{" "}
                        {house.total_residents === 1
                          ? "житель"
                          : house.total_residents < 5
                            ? "жителя"
                            : "жителей"}
                        {house.hasMunicipal && (
                          <Tag
                            style={{
                              marginLeft: 8,
                              background: COLORS.northernBlue,
                              color: "#fff",
                              border: "none",
                              borderRadius: RADIUS.xs,
                              fontSize: 11,
                              padding: "0 6px",
                            }}
                          >
                            🏛️ мун.
                          </Tag>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      {house.residents.slice(0, 3).map((r: any) => (
                        <div
                          key={r._id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            background: COLORS.background,
                            borderRadius: RADIUS.sm,
                            padding: "6px 10px",
                            minWidth: 80,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: COLORS.textPrimary,
                              textAlign: "center",
                            }}
                          >
                            {getFullName(r).split(" ").slice(0, 2).join(" ")}
                          </span>
                          {r["№ квартиры"] && (
                            <span
                              style={{
                                fontSize: 11,
                                color: COLORS.terracottaDark,
                              }}
                            >
                              кв. {r["№ квартиры"]}
                            </span>
                          )}
                        </div>
                      ))}
                      {house.residents.length > 3 && (
                        <Tag
                          style={{
                            background: COLORS.background,
                            color: COLORS.textSecondary,
                            border: "none",
                            borderRadius: RADIUS.sm,
                          }}
                        >
                          +{house.residents.length - 3}
                        </Tag>
                      )}
                    </div>
                    <RightOutlined
                      style={{
                        marginLeft: 16,
                        color: COLORS.textSecondary,
                        fontSize: 14,
                      }}
                    />
                  </div>
                </Card>
              ))}
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                showTotal={(t) => `Всего ${t} домов`}
                pageSizeOptions={["10", "20", "50"]}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps || 20);
                }}
              />
            </div>
          </div>
        ) : data.length > 0 ? (
          // Режим списком — таблица
          <Card
            styles={{ body: { padding: 0 } }}
            style={{
              borderRadius: RADIUS.lg,
              overflow: "hidden",
              border: `1px solid ${COLORS.borderLight}`,
              boxShadow: COLORS.shadowSmall,
            }}
          >
            <Table
              columns={columns}
              dataSource={paginatedData}
              rowKey="_id"
              pagination={{
                current: page,
                pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `Всего ${t} жителей`,
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
                onClick: () => showDetails(record),
              })}
            />
          </Card>
        ) : (
          <Empty description="Нет данных" style={{ marginTop: 48 }} />
        )}
      </Spin>

      {/* Drawer фильтров */}
      <Drawer
        title="🔍 Фильтры жителей"
        placement="right"
        width={400}
        open={filterVisible}
        onClose={() => setFilterVisible(false)}
        styles={{ body: { padding: 0 } }}
      >
        <Space
          direction="vertical"
          size="middle"
          style={{
            width: "100%",
            padding: "0 24px 24px 24px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Input
            placeholder="Поиск по ФИО, адресу..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined style={{ color: COLORS.textSecondary }} />}
            size="large"
            allowClear
            style={{ borderRadius: RADIUS.sm, width: FILTER_INPUT_WIDTH }}
          />

          <Select
            placeholder="Пол"
            value={gender}
            onChange={setGender}
            size="large"
            allowClear
            style={{ borderRadius: RADIUS.sm, width: FILTER_INPUT_WIDTH }}
          >
            <Option value="Мужской">👨 Мужской</Option>
            <Option value="Женский">👩 Женский</Option>
          </Select>

          <Select
            placeholder="Категория"
            value={category}
            onChange={setCategory}
            size="large"
            allowClear
            style={{ borderRadius: RADIUS.sm, width: FILTER_INPUT_WIDTH }}
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
            size="large"
            allowClear
            style={{ borderRadius: RADIUS.sm, width: FILTER_INPUT_WIDTH }}
          >
            <Option value="yes">👶 Да</Option>
            <Option value="no">👤 Нет</Option>
          </Select>

          <Select
            placeholder="Вид фонда"
            value={vidFond}
            onChange={setVidFond}
            size="large"
            allowClear
            style={{ borderRadius: RADIUS.sm, width: FILTER_INPUT_WIDTH }}
          >
            <Option value="Коммерческий">🏢 Коммерческий</Option>
            <Option value="Специализированный">📋 Специализированный</Option>
            <Option value="Маневренный">🚚 Маневренный</Option>
          </Select>

          <Select
            placeholder="Льготные категории"
            value={privilege}
            onChange={setPrivilege}
            size="large"
            allowClear
            style={{ borderRadius: RADIUS.sm, width: FILTER_INPUT_WIDTH }}
          >
            {privileges.map((p) => (
              <Option key={p} value={p}>
                ⭐ {p}
              </Option>
            ))}
          </Select>

          <Space style={{ width: FILTER_INPUT_WIDTH }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => {
                handleSearch();
                setFilterVisible(false);
              }}
              block
              style={{
                background: COLORS.terracotta,
                borderColor: COLORS.terracotta,
                borderRadius: RADIUS.md,
                height: 44,
                fontWeight: 600,
              }}
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
              style={{ borderRadius: RADIUS.md, height: 44 }}
            >
              Сбросить
            </Button>
          </Space>
        </Space>
      </Drawer>

      <ResidentDrawer
        visible={drawerVisible}
        resident={selectedResident}
        onClose={() => setDrawerVisible(false)}
        getFullName={getFullName}
        getAddress={getAddress}
        getGender={getGender}
        formatDate={formatDate}
      />
    </div>
  );
};
