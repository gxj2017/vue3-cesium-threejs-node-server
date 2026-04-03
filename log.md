# 修改日志

## 2026-04-02（下午）

- **前端**：`DashboardView.vue` 首页三张导航卡片改为左侧图标、右侧标题+描述布局，并配套 SVG 与 `.nav-link__body` 等样式；`.card-icon` 略放大以适配横向排版。
- **前端**：`src/styles/global.css` 增加全局变量 `--layout-content-max-width`（默认 `1200px`）；`DashboardView.vue` 中 `.content-grid` 的 `max-width` 改为引用该变量。
- **数据库**：移除 JSON 文件存储实现；**全项目统一仅使用 MongoDB**。`src/db/index.js` 仅委托 `mongoDb.js`；删除 `src/db/jsonDb.js`。
- **配置**：去掉 `DB_DRIVER`；`.env.example` 仅保留 `MONGODB_URI`、`MONGODB_DB_NAME` 与可选 `DB_PATH`（旧 json 导入用）。
- **前端 UI**：`TopMenu.vue` 修复导航项选中后视觉上比默认态“更大”的问题——链接/按钮默认增加 `1px solid transparent` 边框占位；选中态仅用内描边 `box-shadow`（去掉外层大扩散阴影）；`button` 增加 `appearance: none`；选中项 hover 时取消 `translateY(-1px)`，避免与未选中高度不一致。
- **前端 UI**：`TopMenu.vue` 顶部链接/按钮使用 `skewX` 呈现轻微平行四边形（`--menu-skew: 8deg`），标签与箭头反向倾斜以保持文字与图标水平；下拉箭头展开时叠加 `rotate(180deg)`。

## 2026-04-02（上午）

- **数据库**：曾支持 JSON / Mongo 双驱动；后改为仅 Mongo。
- **依赖**：`package.json` 增加 `mongodb`。
- **异步化**：数据库与 `userModel` 的读写改为 async；`authController` 中相应 `await`；`server.js` 使用 `bootstrap()` 在启动前 `await db.initialize()`，优雅关闭时 `await db.close()`。
- **Mongo 管理员**：`mongoDb.initialize()` 在库中尚无 `admin` 时，优先从 `DB_PATH` 指向的 `database.json` 导入管理员（保留原 id 与密码哈希）；否则仍创建 `admin` / `admin123`。脚本 `npm run db:import-admin` 可强制用 JSON 中的 admin **覆盖** Mongo 里同名用户。

## 2026-04-02（前端）

- 优化 `DashboardView.vue`：顶部三栏科技导航栏（左侧品牌、 中间菜单组件、右侧用户信息与退出按钮），内容区独立滚动不跟随顶部滚动。
- 新增公共组件 `src/components/layout/TopMenu.vue`：支持带下拉菜单的顶部菜单项结构，并在 `DashboardView.vue` 中使用。
- 删除旧的 `src/views/dashboard/components/DashboardMenu.vue`（避免组件命名混淆）。
- 内容区展示三张流光科技卡片，包含 hover 动效与卡片流光边框动画。
- 首页中间区域补回三个 `router-link`：`/cesium`、`/sgmap`、`/threejs`（类名 `nav-link`）。
- 进一步优化：移除首页 `hero` 区域中的 `quick-links` 三个 `router-link`（不再在这里展示）。
- 进一步优化：`DashboardView.vue` 中间内容区域改为 `div.quick-links`，放置三个导航卡片（`/cesium`、`/sgmap`、`/threejs`），并使用流光科技卡片 hover 动效样式。
- 修复 UI：`TopMenu.vue` 的下拉按钮补齐指示点与 hover/active 视觉；同时提升顶部导航的层级（`z-index`/`overflow`），避免下拉菜单被遮挡。
- 交互优化：`TopMenu.vue` 下拉支持点击 popup 层外关闭（document 外部点击自动收起）。
- 交互优化：`TopMenu.vue` 下拉支持鼠标离开 popup 区域自动关闭（`@mouseleave` 收起）。
- 页面结构封装：新增 `vue3-cesium-threejs-web/src/components/layout/PageLayout.vue`，将顶部导航 + 内容区滚动 + `router-view` 统一封装；并更新路由让 `/dashboard`、`/cesium`、`/threejs`、`/sgmap` 统一使用该布局。
- `DashboardView.vue` 精简为仅渲染中间三个导航卡片，由 `PageLayout` 负责顶部导航与主内容滚动区域。
- 修复 `SgMapView` 初始化失败：在进入 PageLayout 后将 SGMap 初始化延后两帧，并在 `useSgMap.ts` 中将容器 id 转为真实 HTMLElement（找不到则抛更明确错误），同时将失败原因打印到控制台。
- UI/代码可读性：优化 `SgMapView.vue` 的错误信息归一化写法，去掉嵌套三元表达式。
- 前端 UI：增强 `PageLayout.vue` 顶部导航背景装饰（网格纹理 + 扫描线动画），降低单调感。
- 前端 UI：按要求移除 `PageLayout.vue` 顶部导航扫描线动画，并把顶部网格调得更密。
