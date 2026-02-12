本地运行示例上传服务器

1. 安装依赖

```bash
cd CWBS-ClassWebsite-show
npm install
```

2. 启动服务器

```bash
npm start
```

服务器默认监听 `http://localhost:3000`，前端会把文件上传到 `POST /api/upload`，上传后的文件可通过 `http://localhost:3000/uploads/<filename>` 访问。

注意：这是示例服务器，未作鉴权或安全硬化，仅供本地开发测试使用。若部署到公网，请添加鉴权、大小限制和类型白名单等安全措施。