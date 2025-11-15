# CORS 问题解决方案

## 问题描述

前端在 `localhost:3001` 尝试直接访问 `https://pan-agent.vercel.app/api/generate-agent/task` 时遇到 CORS 错误：
```
Access to fetch at 'https://pan-agent.vercel.app/api/generate-agent/task' 
from origin 'http://localhost:3001' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 解决方案

已实现 **Next.js API 代理路由**来解决 CORS 问题。

### 实现原理

1. **前端不再直接调用外部 API**
   - 前端调用本地的 `/api/proxy-agent` 路由
   - 本地 API 路由作为代理，转发请求到目标 Agent API

2. **服务器到服务器请求没有 CORS 限制**
   - Next.js 服务器端调用外部 API
   - 服务器端不受浏览器 CORS 策略限制

3. **代理路由功能**
   - 支持 GET 和 POST 请求
   - 转发请求头和请求体
   - 转发响应状态码和响应数据
   - 错误处理和日志记录

## 已修改的文件

### 1. `/app/api/proxy-agent/route.ts` (新建)
- Next.js API 路由，作为代理服务器
- 支持 GET 和 POST 方法
- 转发请求到目标 Agent API

### 2. `/app/agent-store/[id]/page.tsx`
- 修改 `handleCallAgent` 函数
- 使用 `/api/proxy-agent` 代理调用 Agent API
- 更新响应解析逻辑

### 3. `/hooks/useAgentCard.ts`
- 修改 `fetchAgentCard` 函数
- 使用 `/api/proxy-agent` 代理加载 Agent Card

## 使用方式

### Agent API 调用
```typescript
// 之前（直接调用，会有 CORS 问题）
response = await fetch(targetUrl, requestConfig);

// 现在（通过代理，无 CORS 问题）
response = await fetch("/api/proxy-agent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: targetUrl,
    method: method,
    headers: requestConfig.headers,
    body: requestConfig.body,
  }),
});
```

### Agent Card 加载
```typescript
// 之前（直接调用，会有 CORS 问题）
response = await fetch(agentCardLink, { method: "GET" });

// 现在（通过代理，无 CORS 问题）
response = await fetch(`/api/proxy-agent?url=${encodeURIComponent(agentCardLink)}`, {
  method: "GET",
});
```

## 优势

1. ✅ **解决 CORS 问题**：完全避免跨域限制
2. ✅ **无需修改外部 API**：不需要在 Vercel API 中添加 CORS 头
3. ✅ **统一错误处理**：可以在代理层统一处理错误
4. ✅ **安全性**：可以添加请求验证和限流
5. ✅ **灵活性**：可以添加缓存、日志等功能

## 注意事项

1. **生产环境**：代理路由会在生产环境中正常工作
2. **性能**：增加了一次服务器转发，但影响很小
3. **错误处理**：代理会捕获并转发错误信息
4. **响应格式**：代理返回的响应格式与原始 API 相同

## 测试

现在可以正常调用 Agent API，不会再遇到 CORS 错误。

如果仍然有问题，请检查：
1. Next.js 开发服务器是否正常运行
2. `/api/proxy-agent` 路由是否可访问
3. 目标 Agent API 是否可访问（从服务器端）

