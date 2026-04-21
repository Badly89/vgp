import axios from "axios";

// Для Vite используем import.meta.env вместо process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерцептор для логирования ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  },
);

export interface HousingItem {
  _id: string;
  Адрес: string;
  Категория?: string;
  Площадь?: number;
  Этажность?: number;
  "Год постройки"?: number;
  owners_count?: number;
  residents_count?: number;
  [key: string]: any;
}

export interface HousingListResponse {
  data: HousingItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Типы для собственников
export interface OwnerItem {
  _id: string;
  [key: string]: any;
}

export interface OwnerListResponse {
  data: OwnerItem[];
  total: number;
  page: number;
  page_size: number;
}

// Типы для жителей
export interface ResidentItem {
  _id: string;
  [key: string]: any;
}

export interface ResidentListResponse {
  data: ResidentItem[];
  total: number;
  page: number;
  page_size: number;
}

// Типы для организаций
export interface OrganizationItem {
  _id: string;
  [key: string]: any;
}

export interface OrganizationListResponse {
  data: OrganizationItem[];
  total: number;
  page: number;
  page_size: number;
}

export const organizationsApi = {
  getList: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
  }) => {
    const response = await api.get("/api/organizations/list", { params });
    return response.data;
  },

  getDetails: async (id: string) => {
    const response = await api.get(`/api/organizations/${id}`);
    return response.data;
  },
};

export interface OwnerGroup {
  address: string;
  owners_count: number;
  owners: OwnerItem[];
}

export interface OwnersGroupedResponse {
  data: OwnerGroup[];
  total_groups: number;
  total_owners: number;
  total_objects: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OwnersGroupedResponse {
  data: Array<{
    address: string;
    house_number: string;
    owners_count: number;
    owners: OwnerItem[];
  }>;
  total_groups: number;
  total_owners: number;
  page: number;
  page_size: number;
}

export const housingApi = {
  getList: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    sort_field?: string;
    sort_order?: "ASC" | "DESC";
    category?: string;
    building_type?: string; // ← ДОБАВЬТЕ ЭТУ СТРОКУ
  }): Promise<HousingListResponse> => {
    const response = await api.get("/api/housing/list", { params });
    return response.data;
  },

  getDetails: async (id: string) => {
    const response = await api.get(`/api/housing/${id}`);
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get("/api/housing/categories/list");
    return response.data.categories;
  },
};

// API для собственников
export const ownersApi = {
  getList: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    sort_field?: string;
    sort_order?: "ASC" | "DESC";
  }): Promise<OwnerListResponse> => {
    const response = await api.get("/api/owners/list", { params });
    return response.data;
  },

  // ✅ НОВЫЙ МЕТОД — группировка по адресу
  getGroupedByAddress: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<OwnersGroupedResponse> => {
    const response = await api.get("/api/owners/grouped-by-address", {
      params,
    });
    return response.data;
  },

  getDetails: async (id: string) => {
    const response = await api.get(`/api/owners/${id}`);
    return response.data;
  },
};

export interface ResidentItem {
  _id: string;
  [key: string]: any;
}

export interface ResidentListResponse {
  data: ResidentItem[];
  total: number;
  page: number;
  page_size: number;
}

export const residentsApi = {
  getList: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    gender?: string;
    category?: string;
    is_child?: string;
    sort_field?: string;
    sort_order?: "ASC" | "DESC";
  }): Promise<ResidentListResponse> => {
    const response = await api.get("/api/residents/list", { params });

    return response.data;
  },

  getCount: async (params: {
    search?: string;
    gender?: string;
    category?: string;
    is_child?: string;
  }): Promise<{ count: number }> => {
    const response = await api.get("/api/residents/count", { params });
    return response.data;
  },

  getDetails: async (id: string) => {
    const response = await api.get(`/api/residents/${id}`);
    return response.data;
  },
};
// API для дашборда
export const dashboardApi = {
  getStats: async (
    group_by: string,
    table?: string,
    aggregation?: string,
  ): Promise<any> => {
    const params: any = { group_by };
    if (table) params.table = table;
    if (aggregation) params.aggregation = aggregation;

    const response = await api.get("/api/dashboard/stats", { params });
    return response.data;
  },

  // Получение сводной информации
  getSummary: async (): Promise<any> => {
    const response = await api.get("/api/dashboard/summary");
    console.log("API getSummary response:", response.data); // Добавьте лог
    return response.data;
  },

  // Получение списка полей таблицы
  getTableFields: async (table: string): Promise<{ fields: string[] }> => {
    const response = await api.get(`/api/dashboard/fields/${table}`);
    return response.data;
  },

  // Получение данных для конкретной конфигурации графика
  getChartData: async (config: any): Promise<any> => {
    const response = await api.post("/api/dashboard/chart-data", config);
    return response.data;
  },

  // Получение расширенной статистики
  getAdvancedStats: async (): Promise<any> => {
    const response = await api.get("/api/dashboard/advanced-stats");
    console.log("API getAdvancedStats response:", response.data); // Добавьте лог
    return response.data;
  },
};

// API для синхронизации
export const syncApi = {
  // Запуск полной синхронизации
  syncAll: async (): Promise<{ status: string; message: string }> => {
    const response = await api.post("/api/sync/all");
    return response.data;
  },

  // Синхронизация только жителей
  syncResidents: async (): Promise<{ status: string; synced: number }> => {
    const response = await api.post("/api/sync/residents");
    return response.data;
  },

  syncOrganizations: async (): Promise<{ status: string; synced: number }> => {
    const response = await api.post("/api/sync/organizations");
    return response.data;
  },

  syncTable: async (
    table: string,
  ): Promise<{ status: string; table: string; synced: number }> => {
    const response = await api.post(`/api/sync/table/${table}`);
    return response.data;
  },

  // Получение статуса синхронизации
  getStatus: async (): Promise<{
    sync_status: Array<{
      table_name: string;
      last_sync: string;
      total_records: number;
      sync_status: string;
    }>;
  }> => {
    const response = await api.get("/api/sync/status");
    return response.data;
  },

  // В syncApi добавить:
  getSchedule: async () => {
    const response = await api.get("/api/sync/schedule");
    return response.data;
  },

  setSchedule: async (data: any) => {
    const response = await api.post("/api/sync/schedule", data);
    return response.data;
  },

  runSyncNow: async () => {
    const response = await api.post("/api/sync/schedule/run-now");
    return response.data;
  },
};
