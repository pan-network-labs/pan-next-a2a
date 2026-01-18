# 系统维护模式

启用维护后，除 `/maintenance` 和 `/_next` 外，所有路径都会重定向到「系统维护中」页面。

## 启用维护

在 `packages/nextjs/.env`、`packages/nextjs/.env.local` 或部署环境变量中添加：

```
NEXT_PUBLIC_MAINTENANCE_MODE=true
```

然后重新部署或重启 `yarn start`。

## 放开系统

- **本地**：从 `.env` / `.env.local` 中删除 `NEXT_PUBLIC_MAINTENANCE_MODE`，或设为 `false`，然后重启 dev server。
- **Vercel 等**：在项目环境变量中删除该变量或设为 `false`，重新部署即可。

无需改代码，只改环境变量即可切换。
