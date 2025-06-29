# Trading777 v1.1

> 完整满足「功能区 1 格式规则」及其他 UI 规范的交易管理仪表盘。

## 开发与运行

```bash
npm install
npm run dev     # 本地开发
npm run build   # 构建生产包 (dist)
npm run preview # 预览 dist
```

- 依赖环境变量：  
  - `VITE_SUPABASE_URL`  
  - `VITE_SUPABASE_ANON_KEY`  
  - `VITE_FINNHUB_KEY`

在 `.env` 中已预填演示用 Key，可直接运行。本地仍可覆盖。

## 目录结构

```
.
├── package.json
├── vite.config.js
├── .env
├── src
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   ├── calc.js
│   ├── price.js
│   └── data.js
└── dist          # 构建后输出
```
