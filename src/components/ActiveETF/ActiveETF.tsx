import styles from './ActiveETF.module.css';

const ACTIVE_ETFS = [
  { code: '00400A', name: '主動國泰動能高息' },
  { code: '00403A', name: '主動統一升級50' },
  { code: '00404A', name: '主動聯博台股優選' },
  { code: '00405A', name: '主動富邦台灣龍耀' },
  { code: '00980A', name: '主動野村臺灣優選' },
  { code: '00981A', name: '主動統一台股增長' },
  { code: '00982A', name: '主動群益台灣強棒' },
  { code: '00984A', name: '主動安聯台灣高息' },
  { code: '00993A', name: '主動安聯台灣' },
];

export function ActiveETF() {
  return (
    <section className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span>⚡ 主動式 ETF 追蹤</span>
          <span className={styles.badge}>每日持股變動</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thName}>ETF 名稱</th>
                <th>新增</th>
                <th>加碼</th>
                <th>減碼</th>
                <th>移出</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVE_ETFS.map((etf) => (
                <tr key={etf.code}>
                  <td className={styles.nameCell}>
                    <span className={styles.etfName}>{etf.name}</span>
                    <span className={styles.etfCode}>{etf.code}</span>
                  </td>
                  <td className={styles.dash}>—</td>
                  <td className={styles.dash}>—</td>
                  <td className={styles.dash}>—</td>
                  <td className={styles.dash}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={styles.note}>主動式 ETF 持股變動資料開發中，敬請期待</p>
      </div>
    </section>
  );
}
