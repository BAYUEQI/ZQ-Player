<h1> ZQ-Player </h1>
<p> 一个简约的音乐播放器 </p>

## 🎉 功能

- ✨ 支持扫码登录
- 📱 支持手机号登录
- 📅 自动进行每日签到及云贝签到
- 💻 支持桌面歌词
- 💻 支持切换为本地播放器，此模式将不会连接网络
- 🎨 封面主题色自适应，支持全站着色
- 🌚 Light / Dark / Auto 模式自动切换
- 📁 本地歌曲管理及分类（建议先使用 [音乐标签](https://www.cnblogs.com/vinlxc/p/11347744.html) 进行匹配后再使用）
- 📁 简易的本地音乐标签编辑及封面修改
- 🎵 **支持播放部分无版权歌曲（可能会与原曲不匹配，客户端独占功能）**
- ⬇️ 下载歌曲 / 批量下载（ 最高支持 Hi-Res，需具有相应会员账号 ）
- ➕ 新建歌单及歌单编辑
- ❤️ 收藏 / 取消收藏歌单或歌手
- 🎶 每日推荐歌曲
- 📻 私人 FM
- ☁️ 云盘音乐上传
- 📂 云盘内歌曲播放
- 🔄 云盘内歌曲纠正
- 🗑️ 云盘歌曲删除
- 📝 支持逐字歌词
- 🔄 歌词滚动以及歌词翻译
- 📹 MV 与视频播放
- 🎶 音乐频谱显示
- ⏭️ 音乐渐入渐出
- 🔄 支持 PWA
- 💬 支持评论区
- 🎵 支持 Last.fm Scrobble（播放记录上报）
- ~~📱 移动端基础适配~~




## 📦️ 获取

### 二进制安装方案

#### 稳定版

可以在 [Releases](https://github.com/BAYUEQI/ZQ-Player/releases) 中获取稳定版


#### 开发版

可以通过 GitHub Actions 工作流获取最新的开发版

[Main Workflow](https://github.com/BAYUEQI/ZQ-Player/actions/workflows/main.yml)

### 自行部署方案

#### ⚙️ Vercel 部署

> 其他部署平台大致相同，在此不做说明

1. 本程序依赖 [ZQ-MusicApi](https://github.com/BAYUEQI/ZQ-MusicApi) 运行，请确保您已成功部署该项目或兼容的项目，并成功取得在线访问地址
2. 点击本仓库右上角的 `Fork`，复制本仓库到你的 `GitHub` 账号
3. 复制 `/.env.example` 文件并重命名为 `/.env`
4. 将 `.env` 文件中的 `VITE_API_URL` 改为第一步得到的 API 地址

   ```js
   VITE_API_URL = "https://example.com";
   ```
也可以在vercel上设置环境变量，`Key`为`VITE_API_URL`，`Value`为`https://example.com`(API地址)

5. 将 `Build and Output Settings` 中的 `Output Directory` 改为 `out/renderer`



6. 点击 `Deploy`，即可成功部署

#### ⚙️ 服务器部署

1. 重复 `⚙️ Vercel 部署` 中的 1 - 4 步骤
2. 克隆仓库

   ```bash
   git clone https://github.com/BAYUEQI/ZQ-Player.git
   ```

3. 安装依赖

   ```bash
   pnpm install
   # 或
   yarn install
   # 或
   npm install
   ```

4. 编译打包

   ```bash
   pnpm build
   # 或
   yarn build
   # 或
   npm build
   ```

5. 将站点运行目录设置为 `out/renderer` 目录

#### ⚙️ 本地部署

1. 本地部署需要用到 `Node.js`。可前往 [Node.js 官网](https://nodejs.org/zh-cn/) 下载安装包，请下载最新稳定版
2. 安装 pnpm

   ```bash
   npm install pnpm -g
   ```

3. 克隆仓库并拉取至本地，此处不再赘述
4. 使用 `pnpm install` 安装项目依赖（若安装过程中遇到网络错误，请使用国内镜像源替代，此处不再赘述）
5. 复制 `/.env.example` 文件并重命名为 `/.env` 并修改配置(可忽略此步，系统会自动构建代理)
6. 打包客户端，请依据你的系统类型来选择，打包成功后，会输出安装包或可执行文件在 `/dist` 目录中，可自行安装

   > 默认情况下，构建命令仅会构建当前系统架构的版本。如需构建特定架构（如 x64 + arm64），请在命令后追加参数，例如：`pnpm build:win -- --x64 --arm64`

   | 命令               | 系统类型 |
   | ------------------ | -------- |
   | `pnpm build:win`   | Windows  |
   | `pnpm build:linux` | Linux    |
   | `pnpm build:mac`   | macOS    |

## 🚀 发布新版本

### 发布流程

项目使用 GitHub Actions 自动构建和发布。发布新版本需要以下步骤：

#### 1. 更新版本号

在 `package.json` 中更新版本号：

```json
{
  "version": "1.0.0-beta.10"  // 修改为你想要的版本号
}
```

**版本号格式建议：**
- 正式版：`1.0.0`, `1.1.0`, `2.0.0`
- 测试版：`1.0.0-beta.10`, `1.0.0-beta.11`
- 预发布：`1.0.0-rc.1`

#### 2. 提交代码

```bash
git add package.json
git commit -m "chore: bump version to 1.0.0-beta.10"
git push
```

#### 3. 创建并推送 Git Tag

Tag 必须与版本号匹配，格式为 `v版本号`：

```bash
# 创建 tag
git tag v1.0.0-beta.10

# 推送到 GitHub
git push origin v1.0.0-beta.10
```

#### 4. 自动构建和发布

推送 tag 后会自动触发 GitHub Actions 工作流：

1. ✅ 自动触发 `.github/workflows/release.yml`
2. ✅ 在 Windows、macOS、Linux 上并行构建
3. ✅ 构建完成后自动创建 GitHub Release
4. ✅ 上传所有平台的安装包（`.exe`, `.dmg`, `.AppImage`, `.deb`, `.rpm` 等）

#### 5. 查看发布状态

- **查看 Actions**：`https://github.com/BAYUEQI/ZQ-Player/actions`
- **查看 Releases**：`https://github.com/BAYUEQI/ZQ-Player/releases`

### 完整示例

```bash
# 1. 更新 package.json 中的 version（手动编辑）
# 假设要发布 1.0.0-beta.10

# 2. 提交版本更新
git add package.json
git commit -m "chore: bump version to 1.0.0-beta.10"
git push

# 3. 创建并推送 tag
git tag v1.0.0-beta.10
git push origin v1.0.0-beta.10
```

### 注意事项

- ⚠️ Tag 格式必须为 `v版本号`（以 `v` 开头）
- ⚠️ Tag 名称应与 `package.json` 中的版本号匹配（去掉 `v`）
- ⚠️ 构建需要一定时间（约 30-60 分钟，取决于平台）
- ⚠️ Release 会自动创建，无需手动创建
- ⚠️ 如需修改 Release 说明，可在 Release 页面编辑

### 版本号确定机制

- **当前应用版本**：从 `package.json` 中的 `version` 字段读取
- **GitHub Releases 版本**：`electron-updater` 会从 GitHub Releases 的 Tag 或 `latest.yml` 中获取最新版本
- **版本比较**：`electron-updater` 自动比较两个版本号，如果远程版本 > 本地版本，则提示更新

## 📦 构建开发版本

开发版本是用于测试的预发布版本，包含最新的功能更新。可以通过两种方式构建开发版本：

### 1. 推送代码到 main 分支

```bash
# 切换到 main 分支
git checkout main

# 推送代码到 main 分支
git push origin main
```

推送到 `main` 分支后，会自动触发 `Build Main` 工作流。修改以下路径的文件会自动触发构建：
- `src/`, `web/`, `electron/`, `public/` 目录
- `package.json`, `pnpm-lock.yaml`
- 构建配置文件

### 2. 查看构建进度

进入 [GitHub Actions](https://github.com/BAYUEQI/ZQ-Player/actions/workflows/main.yml) 查看最新的 `Build Main` 工作流，实时查看构建状态。

### 3. 下载开发版本

- 构建完成后，点击对应的工作流运行
- 在 **Artifacts** 部分下载所需的开发版本：
  - `Windows Setup x64` / `Windows Setup arm64`：Windows 安装程序
  - `Windows Portable x64` / `Windows Portable arm64`：Windows 便携版
  - `macOS DMG x64` / `macOS DMG arm64`：macOS 安装程序
  - `macOS Zip x64` / `macOS Zip arm64`：macOS 便携版
  - `Linux AppImage x64` / `Linux AppImage arm64`：Linux 应用包

### 注意事项

- ⏱️ 构建通常需要 15-30 分钟
- 🌍 在 Windows、macOS、Linux 上并行构建
- 📥 Artifacts 会在 GitHub Actions 中保留 30 天
- ⚠️ 开发版本可能包含未稳定的功能，仅供测试使用

## 🎵 网易云音乐Cookie获取
1. 使用电脑打开网易云网页
这里推荐使用Edge或Google浏览器，在浏览器访问网易云音乐的官网，登录自己的账号；一切准备就绪后进入个人主页进入下一步操作
![alt text](public/images/1.png)

3. 使用浏览器开发者工具获取Cookie
进入到个人主页后，按下“F12”键，单击“网络”
![alt text](public/images/2.png)

此时需要刷新一下页面，按下“Ctrl+R”组合键，此时单击列表出现的第一个选项
![alt text](public/images/3.png)

进入之后下拉，找到“Cookie”字眼，将`MUSIC_U=xxxx;`全部复制下来（注意！不要复制错了、多了或者少了）
![alt text](public/images/4.png)




