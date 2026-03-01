# 高策纪念徐若薇（Next.js + Vercel）

这是“高策纪念徐若薇”的线上纪念站，以**时间线为唯一主轴**组织所有回忆与内容：

- 生平掠影
- 光影记忆（照片/视频）
- 字里行间（纪念文字）
- 她爱的一切（书、歌、诗句等）
- 足迹与贡献
- 访客互动（点亮蜡烛、送花）

所有内容都锚定在具体时间节点上，让回忆像“生命之书”一样被滚动阅读。

## 项目定位

- 本站用途：纪念徐若薇，记录她的人生片段与温暖影响。
- 叙事方式：按时间推进，避免内容孤岛化。
- 维护方式：高策可持续新增时间节点、文字、图片与视频。

## 本地运行

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>

## 内容编辑（高策维护）

核心内容在：

- `src/content/timeline/` 目录下的各个节点文件（每个块一个文件）
- `src/content/timeline/index.ts` 统一 merge 所有块
- `src/types/memory.ts` 统一类型定义

你可以按节点修改：

- `orderDate`：用于 merge 后排序（推荐格式：`YYYY-MM` 或 `YYYY-MM-DD`）
- `year`：日期/年份
- `title`：节点标题
- `summary`：核心叙述
- `biography`：生平掠影
- `moments`：记忆片段列表
- `writing`：纪念文字
- `favorites`：她爱的一切
- `contributions`：足迹与贡献
- `media`：照片/视频/音乐条目

如果某条 `media` 是图片，可增加 `src` 字段，例如：

- `src: "/memories/2015/photo.JPG"`
- `imagePosition: "center 25%"`（控制显示区域，等同 CSS `object-position`）
- `imageScale: 1.08`（可选，轻微放大裁剪）

页面会自动优先读取 `/optimized/...webp`，不存在时回退到原图。

## 顶部图片（avatar/photo）

- 文件位置：`public/avatar.JPG`、`public/photo.JPG`
- 页面展示：`src/app/page.tsx` 顶部 Hero 区
- `photo.JPG` 当前使用横幅裁剪（`object-cover` + `object-[center_30%]`），可调这个位置参数来改变取景
- 移动端优化：已配置 `sizes`
- 画质压缩：已配置 `quality`（主图 68、头像 60），用于降低网页传输体积

## 自动图片降精度

- 运行命令：`npm run optimize:images`
- 脚本会自动扫描 `public/` 下的图片，并生成压缩后的 WebP 到 `public/optimized/`
- 页面会优先加载 `optimized` 图片；若不存在则自动回退到原图

可选环境变量（执行命令时设置）：

- `IMAGE_QUALITY`：默认 `68`
- `IMAGE_MAX_WIDTH`：默认 `1600`

示例：`IMAGE_QUALITY=60 IMAGE_MAX_WIDTH=1280 npm run optimize:images`

## Vercel 部署（正式站点）

1. 将仓库推送到 GitHub。
2. 登录 Vercel 并导入该仓库。
3. 保持默认构建设置（Next.js）。
4. 点击 Deploy。

部署后每次 push 都会自动触发更新。

## 真实计数（Vercel Blob，单文件简化版）

已实现真实计数接口：

- `GET /api/tribute`：读取蜡烛/鲜花计数
- `POST /api/tribute`：提交一次点亮（`type: candle | flower`）

实现方式（最简单）：

1. 计数统一存放在 Blob 单文件：`tributes/counts.json`。
2. 每次点击时，后端流程为“读取当前数字 → +1 → 回写该文件”。
3. 接入成本低，便于快速上线。

### Limitation

- 该方案不保证并发一致性。
- 多人同时点击时，可能出现覆盖写入，导致少量丢计数。
- 适用于“一致性要求不高”的纪念站场景；若后续需要严格准确，建议切回 Redis 原子计数。

Vercel Blob 需要环境变量（例如 `BLOB_READ_WRITE_TOKEN`）。
如果你在本地开发想看到真实计数，可把对应变量写入本地 `.env.local`。
若未配置该变量，接口会自动降级为进程内临时计数（重启开发服务器后会清零）。

## 运行环境说明

当前依赖为 Next.js 16，建议 Node.js `>=20.9.0`。
如果你本地 Node 版本较低，建议升级 Node 后再执行开发与构建命令。
