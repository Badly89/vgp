import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import { MainLayout } from "./components/Layout/MainLayout";
import { LandingPage } from "./components/LandingPage";
import { HousingTable } from "./components/Tables/HousingTable";
import { OwnersTable } from "./components/Tables/OwnersTable";
import { ResidentsTable } from "./components/Tables/ResidentsTable";
import { OrganizationsTable } from "./components/Tables/OrganizationsTable";
import { SyncManager } from "./components/SyncManager/SyncManager";
import { DashboardBuilder } from "./components/Dashboard/DashboardBuilder";
import { HouseResidents } from "./components/Tables/HouseResidents";

const basename = "";

function App() {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <Router basename={basename}>
        <Routes>
          {/* Главная страница-портал */}
          <Route path="/" element={<LandingPage />} />

          {/* Остальные страницы внутри MainLayout */}
          <Route
            path="/housing"
            element={
              <MainLayout>
                <HousingTable />
              </MainLayout>
            }
          />
          <Route
            path="/owners"
            element={
              <MainLayout>
                <OwnersTable />
              </MainLayout>
            }
          />
          <Route
            path="/residents"
            element={
              <MainLayout>
                <ResidentsTable />
              </MainLayout>
            }
          />
          <Route
            path="/residents/house/:address/:houseNumber"
            element={
              <MainLayout>
                <HouseResidents />
              </MainLayout>
            }
          />
          <Route
            path="/organizations"
            element={
              <MainLayout>
                <OrganizationsTable />
              </MainLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <DashboardBuilder />
              </MainLayout>
            }
          />
          <Route
            path="/sync"
            element={
              <MainLayout>
                <SyncManager />
              </MainLayout>
            }
          />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
