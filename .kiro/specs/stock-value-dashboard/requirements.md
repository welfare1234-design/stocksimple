# 需求文件：台股價值投資儀表板

## 簡介

台股價值投資儀表板是一個以深色主題為基礎的網頁應用程式，提供全球市場指數總覽、台股加權指數估值分析、ETF 成分股持股總覽，以及個股詳細估值資訊。系統遵循台股慣例（上漲紅色、下跌綠色），協助價值投資者依據估值區間做出進場決策。

## 詞彙表

- **儀表板 (Dashboard)**：系統的主頁面，整合顯示所有市場數據與估值資訊
- **導航列 (Navigation_Bar)**：頁面頂部的導航元件，包含品牌名稱、更新時間與操作按鈕
- **指數卡片 (Index_Card)**：顯示單一市場指數即時數據的 UI 元件
- **指數總覽區 (Index_Overview)**：水平排列多張指數卡片的區域，展示全球市場指數
- **估值區間 (Valuation_Band)**：根據乖離率將指數或股價劃分為不同等級的區間，包含恐慌、崩跌、特價、便宜、合理、偏高、昂貴、瘋狂共八個等級
- **進場比例 (Entry_Ratio)**：每個估值區間對應的建議資金投入百分比
- **乖離率 (Deviation_Rate)**：目前價格相對於年均值的偏離百分比
- **ETF 持股總覽 (ETF_Holdings_Overview)**：顯示特定 ETF 成分股清單及其估值狀態的區域
- **股票卡片 (Stock_Card)**：顯示單一個股摘要資訊的 UI 元件
- **估值彈窗 (Valuation_Modal)**：點擊個股後彈出的詳細估值資訊視窗
- **本益比 (PE_Ratio)**：股價除以每股盈餘的倍數
- **每股盈餘 (EPS)**：公司每股的稅後淨利
- **漲跌幅 (Change_Percentage)**：價格變動的百分比
- **台股加權指數 (TAIEX)**：台灣證券交易所發行量加權股價指數

## 需求

### 需求 1：頂部導航列

**使用者故事：** 身為投資者，我希望在頁面頂部看到品牌識別、最新更新時間與操作入口，以便確認資料時效性並進行設定或登入。

#### 驗收條件

1. THE Navigation_Bar SHALL 在頁面頂部顯示品牌名稱「股市看板」
2. THE Navigation_Bar SHALL 在右側顯示資料最後更新時間，格式為「更新 上午/下午 HH:MM:SS」
3. THE Navigation_Bar SHALL 在右側提供設定圖示按鈕
4. THE Navigation_Bar SHALL 在右側提供登入按鈕
5. WHEN 使用者點擊設定圖示，THE Navigation_Bar SHALL 開啟設定面板
6. WHEN 使用者點擊登入按鈕，THE Navigation_Bar SHALL 開啟登入流程

---

### 需求 2：全球指數總覽

**使用者故事：** 身為投資者，我希望在儀表板上一覽全球主要市場指數的即時數據，以便快速掌握國際市場動態與風險情緒。

#### 驗收條件

1. THE Index_Overview SHALL 以水平可捲動的卡片列方式顯示以下九項指數：台股加權指數、台指期外資淨額、CNN 恐懼貪婪指數、道瓊工業指數、新興債券指數、費城半導體指數、S&P 500 指數、VIX 恐慌指數、台幣年經常帳率
2. THE Index_Card SHALL 顯示指數名稱、目前數值、漲跌點數、漲跌百分比、更新日期共五項資訊
3. WHEN 漲跌百分比為正值，THE Index_Card SHALL 以紅色文字顯示漲跌數據
4. WHEN 漲跌百分比為負值，THE Index_Card SHALL 以綠色文字顯示漲跌數據
5. THE Index_Card SHALL 針對特殊指標顯示額外語意標籤（例如台指期外資淨額顯示「偏空」、CNN 恐懼貪婪指數顯示「極度恐懼」、台幣年經常帳率顯示「大幅偏離」）
6. WHEN 指數資料更新時，THE Index_Overview SHALL 自動刷新所有 Index_Card 的顯示數值

---

### 需求 3：台股加權指數估值區間

**使用者故事：** 身為價值投資者，我希望看到台股加權指數目前所處的估值區間，以便根據估值高低決定進場比例。

#### 驗收條件

1. THE Dashboard SHALL 顯示台股加權指數估值區，包含目前加權指數數值、年漲幅百分比、年均值三項摘要資訊
2. THE Valuation_Band SHALL 以表格形式顯示八個估值等級：恐慌、崩跌、特價、便宜、合理、偏高、昂貴、瘋狂
3. THE Valuation_Band SHALL 為每個估值等級顯示以下四項資訊：進場比例、估值區間名稱、乖離率、對應的指數點位
4. THE Valuation_Band SHALL 使用顏色區分不同估值等級：深綠色代表恐慌至特價區間、淺綠色代表便宜區間、黃色代表合理區間、橙色代表偏高區間、紅色代表昂貴至瘋狂區間
5. THE Valuation_Band SHALL 以箭頭或指示標記標示目前加權指數所處的估值等級位置
6. THE Valuation_Band SHALL 為恐慌等級設定進場比例 100%、崩跌等級 100%、特價等級 100%、便宜等級 100%、合理等級 70%、偏高等級 50%、昂貴等級 30%、瘋狂等級 10%

---

### 需求 4：ETF 持股總覽

**使用者故事：** 身為 ETF 投資者，我希望查看特定 ETF 的成分股清單及每檔個股的估值狀態，以便評估 ETF 整體持股品質。

#### 驗收條件

1. THE ETF_Holdings_Overview SHALL 提供時間週期切換標籤，包含「日」、「週」、「月」三個選項
2. THE ETF_Holdings_Overview SHALL 以標籤列方式顯示可選擇的 ETF 代碼（包含 0059、0051、0052、0053、0056、00878、00919、00929、00940）
3. WHEN 使用者點擊某個 ETF 代碼標籤，THE ETF_Holdings_Overview SHALL 載入並顯示該 ETF 的成分股清單
4. THE ETF_Holdings_Overview SHALL 提供篩選按鈕，包含「熱門」、「漲停」、「跌停」三個篩選條件
5. THE ETF_Holdings_Overview SHALL 顯示「買入中」、「上漲」、「下跌」三種狀態指示
6. THE Stock_Card SHALL 以網格排列方式顯示每檔成分股，每列顯示四至五張卡片
7. THE Stock_Card SHALL 顯示以下資訊：股票名稱、股票代碼、目前股價、漲跌金額、漲跌百分比、EPS 數值、估值狀態標籤
8. WHEN 股價上漲，THE Stock_Card SHALL 以紅色顯示漲跌數據
9. WHEN 股價下跌，THE Stock_Card SHALL 以綠色顯示漲跌數據
10. THE Stock_Card SHALL 以不同顏色的標籤顯示估值狀態（合理、特價、便宜、昂貴等）

---

### 需求 5：個股詳細估值彈窗

**使用者故事：** 身為投資者，我希望點擊個股後能看到詳細的估值分析，包含本益比區間與對應股價，以便精確判斷個股的買入時機。

#### 驗收條件

1. WHEN 使用者點擊任一 Stock_Card，THE Valuation_Modal SHALL 以彈窗形式顯示該個股的詳細估值資訊
2. THE Valuation_Modal SHALL 顯示以下基本資訊：股票名稱、股票代碼、交易所名稱、最新股價（含新台幣符號）、漲跌金額與百分比、市值、預估 EPS（含預估年度）、目前估值狀態標籤
3. THE Valuation_Modal SHALL 以表格形式顯示六個估值等級的本益比倍數：特價、便宜、合理、偏高、昂貴、瘋狂
4. THE Valuation_Modal SHALL 根據預估 EPS 乘以各等級本益比倍數計算並顯示對應的目標股價
5. THE Valuation_Modal SHALL 以漸層色條（綠色→黃色→紅色）視覺化呈現估值區間分布
6. THE Valuation_Modal SHALL 在漸層色條上標示目前股價所處的位置
7. WHEN 使用者點擊彈窗外部區域或關閉按鈕，THE Valuation_Modal SHALL 關閉彈窗並返回 ETF 持股總覽頁面
8. THE Valuation_Modal SHALL 確保本益比倍數乘以預估 EPS 等於對應目標股價（計算一致性）

---

### 需求 6：深色主題與視覺風格

**使用者故事：** 身為長時間看盤的投資者，我希望儀表板採用深色主題並遵循台股色彩慣例，以便減少眼睛疲勞並直覺判讀漲跌。

#### 驗收條件

1. THE Dashboard SHALL 採用深色主題，主要背景色為深灰色或黑色
2. THE Dashboard SHALL 使用稍淺的深灰色作為卡片背景色，與主背景形成層次區分
3. THE Dashboard SHALL 遵循台股色彩慣例：上漲使用紅色、下跌使用綠色
4. THE Dashboard SHALL 使用綠色作為品牌強調色
5. THE Dashboard SHALL 中文內容使用系統預設中文字體、數字使用等寬字體以確保數據對齊
6. THE Dashboard SHALL 支援桌面瀏覽器的響應式佈局，在 1280px 至 1920px 寬度範圍內正常顯示

---

### 需求 7：資料更新機制

**使用者故事：** 身為投資者，我希望儀表板的數據能定期自動更新，以便獲取接近即時的市場資訊。

#### 驗收條件

1. THE Dashboard SHALL 定期自動從資料來源取得最新的指數與股價數據
2. WHEN 資料更新完成，THE Navigation_Bar SHALL 更新顯示的最後更新時間
3. IF 資料來源無法連線，THEN THE Dashboard SHALL 顯示連線錯誤提示，並保留最後一次成功取得的數據
4. IF 資料來源回傳格式異常，THEN THE Dashboard SHALL 記錄錯誤日誌並維持既有顯示內容不變
