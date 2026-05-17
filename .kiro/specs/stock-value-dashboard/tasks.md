# 實作計畫：台股價值投資儀表板

## 概述

以 React 18 + TypeScript + Vite 技術棧，逐步建構台股價值投資儀表板。從專案初始化與型別定義開始，依序實作各功能模組，最終整合資料層與狀態管理，完成完整的單頁式應用程式。

## 任務

- [x] 1. 建立專案結構與核心型別定義
  - [x] 1.1 初始化 Vite + React + TypeScript 專案
    - 使用 Vite 建立專案，安裝 vitest、fast-check 等開發依賴
    - 建立 `src/types/index.ts`，定義所有核心型別：`MarketIndex`、`ValuationLevel`、`TaiexValuation`、`StockHolding`、`StockDetail`、`PERatioLevel`、`TimePeriod`、`HoldingsFilter`、`ValuationLevelName`、`StockValuationStatus`
    - 建立 `src/utils/` 目錄結構，包含 `formatting.ts`、`valuation.ts`、`colors.ts` 空檔案
    - _需求: 6.1, 6.5, 6.6_

  - [x] 1.2 建立 CSS 主題變數與全域樣式
    - 在 `src/index.css` 中定義所有 CSS Custom Properties（背景色、文字色、台股慣例色、品牌色、估值色階、字體、間距、圓角）
    - 設定深色主題全域樣式，包含 body 背景色與預設字體
    - _需求: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 1.3 實作格式化工具函式
    - 在 `src/utils/formatting.ts` 中實作：`formatUpdateTime(date: Date): string` 將時間格式化為「更新 上午/下午 HH:MM:SS」
    - 實作 `formatNumber(value: number): string` 格式化數值（千分位）
    - 實作 `formatPercent(value: number): string` 格式化百分比
    - 實作 `formatCurrency(value: number): string` 格式化新台幣金額
    - _需求: 1.2, 2.2, 5.2_

  - [x] 1.4 撰寫格式化工具函式的屬性測試
    - **Property 1: formatUpdateTime 輸出格式一致性** — 任意有效 Date 輸入，輸出必定符合「更新 上午/下午 HH:MM:SS」格式
    - **驗證: 需求 1.2**
    - **Property 2: formatPercent 正負號一致性** — 正數輸入產生正值字串，負數輸入產生負值字串，零輸入產生零值字串
    - **驗證: 需求 2.2**

  - [x] 1.5 實作估值計算工具函式
    - 在 `src/utils/valuation.ts` 中實作：`calculateTargetPrice(eps: number, peRatio: number): number` 計算目標股價
    - 實作 `calculateDeviationRate(currentValue: number, average: number): number` 計算乖離率
    - 實作 `determineValuationLevel(currentIndex: number, bands: ValuationLevel[]): ValuationLevelName` 判斷目前所處估值等級
    - 實作 `getEntryRatio(level: ValuationLevelName): number` 取得進場比例
    - 建立 `VALUATION_BAND_CONFIG` 常數，定義八個估值等級的預設配置
    - _需求: 3.2, 3.3, 3.6, 5.4, 5.8_

  - [x] 1.6 撰寫估值計算工具函式的屬性測試
    - **Property 3: calculateTargetPrice 計算一致性** — 對任意正數 EPS 與正數 PE，`calculateTargetPrice(eps, pe)` 必等於 `eps * pe`
    - **驗證: 需求 5.8**
    - **Property 4: calculateDeviationRate 對稱性** — `deviationRate(a, b)` 與 `deviationRate(b, a)` 符號相反
    - **驗證: 需求 3.3**
    - **Property 5: determineValuationLevel 單調性** — 指數越高，估值等級不低於較低指數的等級
    - **驗證: 需求 3.2, 3.5**
    - **Property 6: getEntryRatio 範圍約束** — 任意估值等級，進場比例介於 10 至 100 之間
    - **驗證: 需求 3.6**

  - [x] 1.7 實作顏色工具函式
    - 在 `src/utils/colors.ts` 中實作：`getChangeColor(changePercent: number): string` 根據漲跌返回紅色/綠色/中性色
    - 實作 `getValuationColor(level: ValuationLevelName | StockValuationStatus): string` 根據估值等級返回對應顏色
    - _需求: 2.3, 2.4, 3.4, 4.8, 4.9, 4.10, 6.3_

  - [x] 1.8 撰寫顏色工具函式的屬性測試
    - **Property 7: getChangeColor 台股慣例一致性** — 正值必返回紅色，負值必返回綠色，零值返回中性色
    - **驗證: 需求 6.3**

- [x] 2. 檢查點 — 確認所有測試通過
  - 確認所有測試通過，如有問題請詢問使用者。

- [x] 3. 實作狀態管理與資料層
  - [x] 3.1 實作 DashboardContext 狀態管理
    - 建立 `src/context/DashboardContext.tsx`
    - 定義 `DashboardState` 介面與 `DashboardAction` 聯合型別
    - 實作 `dashboardReducer` 函式處理所有 action 類型
    - 建立 `DashboardProvider` 元件與 `useDashboard` 自訂 Hook
    - 初始狀態包含：`marketIndices`、`taiexValuation`、`etfHoldings`、`selectedETF`、`timePeriod`、`holdingsFilter`、`lastUpdatedTime`、`isLoading`、`error`
    - _需求: 1.2, 2.6, 7.2, 7.3_

  - [x] 3.2 撰寫 dashboardReducer 的屬性測試
    - **Property 8: Reducer 狀態不可變性** — 任意 action dispatch 後，原始狀態物件不被修改
    - **驗證: 需求 7.3**
    - **Property 9: SET_ERROR 後保留既有資料** — dispatch SET_ERROR 後，marketIndices、taiexValuation、etfHoldings 維持不變
    - **驗證: 需求 7.3, 7.4**

  - [x] 3.3 實作 DataService 資料服務
    - 建立 `src/services/dataService.ts`
    - 實作 `fetchMarketIndices()`、`fetchTaiexValuation()`、`fetchETFHoldings(etfCode)`、`fetchStockDetail(stockCode)` 四個非同步函式
    - 初期使用 Mock Data 回傳靜態資料，預留 API 介面
    - 實作錯誤處理：連線失敗時拋出具描述性的錯誤
    - _需求: 7.1, 7.3, 7.4_

  - [x] 3.4 實作 PollingManager 輪詢管理
    - 建立 `src/services/pollingManager.ts`
    - 實作 `start(intervalMs)`、`stop()`、`onUpdate(callback)`、`onError(callback)` 方法
    - 使用 `setInterval` 定期觸發，元件卸載時清除計時器
    - 錯誤時觸發 onError 回呼，不中斷輪詢
    - _需求: 7.1, 7.2, 7.3_

- [x] 4. 實作 NavigationBar 元件
  - [x] 4.1 建立 NavigationBar 元件與樣式
    - 建立 `src/components/NavigationBar/NavigationBar.tsx` 與 `NavigationBar.module.css`
    - 顯示品牌名稱「stocksimple」
    - 右側顯示格式化後的最後更新時間
    - 右側提供設定圖示按鈕與登入按鈕
    - 接收 `lastUpdatedTime`、`onSettingsClick`、`onLoginClick` props
    - _需求: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 4.2 撰寫 NavigationBar 元件單元測試
    - 測試品牌名稱正確渲染
    - 測試更新時間格式化顯示
    - 測試設定與登入按鈕點擊事件觸發
    - _需求: 1.1, 1.2, 1.5, 1.6_

- [x] 5. 實作全球指數總覽模組
  - [x] 5.1 建立 IndexCard 元件
    - 建立 `src/components/IndexOverview/IndexCard.tsx`
    - 顯示指數名稱、目前數值、漲跌點數、漲跌百分比、更新日期
    - 漲跌正值以紅色、負值以綠色顯示
    - 支援顯示額外語意標籤（如「偏空」、「極度恐懼」）
    - _需求: 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 建立 IndexOverview 元件與樣式
    - 建立 `src/components/IndexOverview/IndexOverview.tsx` 與 `IndexOverview.module.css`
    - 以水平可捲動卡片列方式排列九項指數卡片
    - 使用 CSS `overflow-x: auto` 實現水平捲動
    - _需求: 2.1, 2.6_

  - [x] 5.3 撰寫 IndexCard 元件單元測試
    - 測試漲跌顏色正確套用
    - 測試語意標籤條件渲染
    - _需求: 2.3, 2.4, 2.5_

- [x] 6. 實作台股加權指數估值區間模組
  - [x] 6.1 建立 ValuationBand 元件與樣式
    - 建立 `src/components/ValuationBand/ValuationBand.tsx` 與 `ValuationBand.module.css`
    - 顯示目前加權指數數值、年漲幅百分比、年均值摘要
    - 以水平表格顯示八個估值等級，每格包含進場比例、等級名稱、乖離率、對應指數點位
    - 使用顏色漸層區分等級（深綠→淺綠→黃→橙→紅）
    - 以箭頭標記目前指數所處估值等級位置
    - _需求: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 6.2 撰寫 ValuationBand 元件單元測試
    - 測試八個估值等級正確渲染
    - 測試目前位置箭頭標記正確顯示
    - 測試進場比例數值正確
    - _需求: 3.2, 3.5, 3.6_

- [x] 7. 實作 ETF 持股總覽模組
  - [x] 7.1 建立 StockCard 元件
    - 建立 `src/components/ETFHoldings/StockCard.tsx`
    - 顯示股票名稱、代碼、目前股價、漲跌金額、漲跌百分比、EPS、估值狀態標籤
    - 漲跌正值紅色、負值綠色
    - 估值狀態以不同顏色標籤顯示
    - 點擊觸發 `onClick` 回呼
    - _需求: 4.7, 4.8, 4.9, 4.10_

  - [x] 7.2 建立 ETFHoldingsOverview 元件與樣式
    - 建立 `src/components/ETFHoldings/ETFHoldingsOverview.tsx` 與 `ETFHoldings.module.css`
    - 實作時間週期切換標籤（日/週/月）
    - 實作 ETF 代碼標籤列（0059、0051、0052、0053、0056、00878、00919、00929、00940）
    - 實作篩選按鈕（熱門、漲停、跌停）
    - 顯示買入中、上漲、下跌狀態指示
    - 以網格排列 StockCard，每列 4-5 張（響應式）
    - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 7.3 撰寫 ETFHoldingsOverview 元件單元測試
    - 測試 ETF 代碼切換觸發正確回呼
    - 測試時間週期切換
    - 測試篩選按鈕狀態
    - _需求: 4.1, 4.2, 4.3, 4.4_

- [x] 8. 檢查點 — 確認所有測試通過
  - 確認所有測試通過，如有問題請詢問使用者。

- [x] 9. 實作個股詳細估值彈窗
  - [x] 9.1 建立 ValuationModal 元件與樣式
    - 建立 `src/components/ValuationModal/ValuationModal.tsx` 與 `ValuationModal.module.css`
    - 顯示基本資訊：股票名稱、代碼、交易所、最新股價（含 NT$ 符號）、漲跌金額與百分比、市值、預估 EPS（含年度）、估值狀態標籤
    - 以表格顯示六個估值等級的本益比倍數與目標股價
    - 實作漸層色條（綠→黃→紅）視覺化估值區間分布
    - 在色條上標示目前股價位置
    - 實作點擊外部區域或關閉按鈕關閉彈窗
    - _需求: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 9.2 撰寫 ValuationModal 元件單元測試
    - 測試目標股價計算一致性（EPS × PE = 目標股價）
    - 測試關閉行為（點擊外部區域、關閉按鈕）
    - _需求: 5.7, 5.8_

- [x] 10. 整合所有模組至 App 根元件
  - [x] 10.1 建立 App 根元件與佈局
    - 建立 `src/App.tsx` 與 `src/App.module.css`
    - 以 `DashboardProvider` 包裹所有子元件
    - 依序排列：NavigationBar → IndexOverview → ValuationBand → ETFHoldingsOverview
    - 實作 ValuationModal 的開啟/關閉邏輯（由 StockCard 點擊觸發）
    - 整合 PollingManager，在 App 掛載時啟動輪詢、卸載時停止
    - 連接 DataService 與 DashboardContext，資料更新時 dispatch 對應 action
    - _需求: 1.1, 2.6, 5.1, 7.1, 7.2_

  - [x] 10.2 實作響應式佈局
    - 確保 1280px 至 1920px 寬度範圍內正常顯示
    - ETF 持股網格在不同寬度下自適應列數
    - _需求: 6.6_

- [x] 11. 最終檢查點 — 確認所有測試通過
  - 確認所有測試通過，如有問題請詢問使用者。

## 備註

- 標記 `*` 的任務為選用任務，可跳過以加速 MVP 開發
- 每個任務皆標註對應的需求編號，確保可追溯性
- 檢查點確保階段性驗證，及早發現問題
- 屬性測試驗證通用正確性，單元測試驗證特定範例與邊界情況
