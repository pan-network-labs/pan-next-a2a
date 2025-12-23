# Dune Analytics Query ID 获取指南

## 📍 如何获取 Query ID

### 步骤 1: 访问 Dune Analytics

1. 打开浏览器，访问 [https://dune.com](https://dune.com)
2. 注册或登录你的账号

### 步骤 2: 创建新查询

1. 登录后，点击页面右上角的 **"New Query"** 或 **"Create"** 按钮
2. 选择你要查询的区块链网络（例如：BNB Chain / BSC）

### 步骤 3: 编写 SQL 查询

在查询编辑器中编写 SQL 查询语句。以下是三个统计数据的查询示例：

#### 1. 登入钱包数（唯一钱包地址数量）

**⚠️ 重要：地址格式**：在 Dune Analytics 中，地址字段是 `varbinary` 类型，必须使用 `0x...` 格式（不带引号），而不是 `'0x...'` 字符串格式。

```sql
-- 查询连接到 PaymentSBT 合约的唯一钱包地址数量
SELECT 
  COUNT(DISTINCT "from") as count
FROM bnb.transactions
WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90
  AND block_time >= NOW() - INTERVAL '90' DAY
```

或者查询所有与你的应用交互的唯一地址（包括 AgentStore 和 PaymentSBT）：

```sql
SELECT 
  COUNT(DISTINCT "from") as count
FROM bnb.transactions
WHERE (
  "to" = 0xcb44Aa73A739de6E0cD805e0a18AC086B658FA41  -- AgentStore 合约地址
  OR "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90  -- PaymentSBT 合约地址
)
  AND block_time >= NOW() - INTERVAL '90' DAY
```

#### 2. 支付次数（总交易数）

```sql
-- 查询支付交易的总次数
SELECT 
  COUNT(*) as count
FROM bnb.transactions
WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90
  AND block_time >= NOW() - INTERVAL '90' DAY
  AND value > 0  -- 只统计有金额的交易
```

#### 3. 支付金额总数

```sql
-- 查询总支付金额（BNB）
SELECT 
  SUM(value) / 1e18 as total_amount  -- 转换为 BNB 单位
FROM bnb.transactions
WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90
  AND block_time >= NOW() - INTERVAL '90' DAY
  AND value > 0
```

### 步骤 4: 获取 Query ID

1. 编写完 SQL 查询后，点击右上角的 **"Run"** 或 **"Execute"** 按钮执行查询
2. 查询执行成功后，查看浏览器地址栏
3. URL 格式类似：`https://dune.com/queries/1234567`
4. **Query ID 就是 URL 中的数字部分**（例如：`1234567`）

### 步骤 5: 配置到项目中

将获取到的 Query ID 添加到 `.env` 文件中：

```env
# Dune Analytics 统计数据 Query IDs
NEXT_PUBLIC_DUNE_QUERY_UNIQUE_WALLETS=1234567
NEXT_PUBLIC_DUNE_QUERY_PAYMENT_COUNT=1234568
NEXT_PUBLIC_DUNE_QUERY_TOTAL_PAYMENT=1234569
```

## 🔍 查找合约地址

如果你需要查询特定合约的数据，可以在以下位置找到合约地址：

### AgentStore 合约地址
- 部署后会在控制台输出
- 或在 `packages/hardhat/broadcast/` 目录下的部署记录中查找

### PaymentSBT 合约地址
- 同样在部署记录中查找
- 或在区块链浏览器（如 BscScan）上搜索合约名称

## 📝 查询结果格式要求

为了确保统计数据正确显示，你的 Dune 查询需要返回以下格式：

### 登入钱包数和支付次数
查询应该返回一个包含 `count` 列的结果：

```sql
SELECT COUNT(*) as count FROM ...
```

结果示例：
```
count
-----
1234
```

### 支付金额总数
查询应该返回一个包含 `total_amount` 列的结果：

```sql
SELECT SUM(value) / 1e18 as total_amount FROM ...
```

结果示例：
```
total_amount
------------
567.89
```

## 🎯 完整示例查询

### ⚠️ 重要：如果查询返回 0，请使用事件（Events）查询

如果 `transactions` 表查询返回 0，但链上确实有记录，**应该查询事件（logs/events）而不是交易**。

### 方法 1: 使用事件（推荐，更准确）

#### 示例 1: 查询 PAN Network 的唯一用户数

```sql
-- 查询所有与 PaymentSBT 合约交互的唯一地址
SELECT 
  COUNT(DISTINCT "from") as count
FROM bnb.transactions
WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90
  AND block_time >= NOW() - INTERVAL '90' DAY
```

#### 示例 2: 查询总支付次数

```sql
SELECT 
  COUNT(*) as count
FROM bnb.transactions
WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90
  AND value > 0
  AND block_time >= NOW() - INTERVAL '90' DAY
```

#### 示例 3: 查询总支付金额（BNB）

```sql
SELECT 
  SUM(value) / 1e18 as total_amount
FROM bnb.transactions
WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90
  AND value > 0
  AND block_time >= NOW() - INTERVAL '90' DAY
```

### 方法 2: 调试查询（先验证数据是否存在）

**步骤 1: 检查是否有任何交易**

```sql
-- 检查合约是否有任何交易（注意：地址使用 0x... 格式，没有引号）
SELECT 
  COUNT(*) as total_transactions,
  MIN(block_time) as first_transaction,
  MAX(block_time) as last_transaction,
  SUM(value) / 1e18 as total_bnb
FROM bnb.transactions
WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90
```

**步骤 2: 检查最近的交易**

```sql
-- 查看最近的 10 笔交易
SELECT 
  "from",
  "to",
  value / 1e18 as value_bnb,
  block_time,
  tx_hash
FROM bnb.transactions
WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90
  AND value > 0
ORDER BY block_time DESC
LIMIT 10
```

**步骤 3: 如果地址格式有问题，使用 varbinary 转换**

```sql
-- 如果上面的查询仍然报错，尝试使用 varbinary 转换函数
SELECT 
  COUNT(*) as count
FROM bnb.transactions
WHERE "to" = varbinary('0xa80447C2B2e958ae12105dba4BE9095557d1CC90')
  AND value > 0
```

### 方法 3: 使用函数调用数据（如果事件查询失败）

```sql
-- 查询调用 makePayment 函数的交易
SELECT 
  COUNT(*) as count
FROM bnb.traces
WHERE "to" = '0xa80447C2B2e958ae12105dba4BE9095557d1CC90'
  AND "type" = 'call'
  AND block_time >= NOW() - INTERVAL '90' DAY
```

## 📋 当前部署的合约地址（BSC Mainnet）

**PaymentSBT 合约地址：**
```
0xa80447C2B2e958ae12105dba4BE9095557d1CC90
```

**AgentStore 合约地址：**
```
0xcb44Aa73A739de6E0cD805e0a18AC086B658FA41
```

**注意：** 地址是大小写敏感的，请确保使用正确的地址。

## ⚠️ 注意事项

1. **如果查询返回 0 但链上有记录**：
   - ✅ **首先运行调试查询**（见下方）验证数据是否存在
   - ✅ **检查合约地址是否正确**（大小写敏感）
   - ✅ **检查时间范围**（可能数据在更早的时间）
   - ✅ **尝试查询事件（logs）而不是交易（transactions）**
   - ✅ **确认网络是否正确**（BSC Mainnet vs Testnet）

2. **表名问题**：
   - 如果 `bsc.transactions` 报错，尝试使用 `bnb.transactions`
   - 如果仍然报错，尝试使用 `ethereum.transactions` 并添加 `chain_id = 56` 条件
   - 在 Dune 查询编辑器中，使用左侧的 "Data" 面板浏览可用的数据表
   - 搜索 "BNB" 或 "BSC" 找到正确的表名

3. **合约地址大小写**：
   - 地址是大小写敏感的
   - 如果查询返回 0，尝试使用 `LOWER()` 函数进行不区分大小写的匹配

2. **列名必须匹配**：
   - 登入钱包数和支付次数：列名必须是 `count`
   - 支付金额总数：列名必须是 `total_amount`

3. **如果列名不同**：
   - 可以在代码中修改 `columns` 配置
   - 或使用 SQL 的 `AS` 关键字重命名列

4. **数据单位**：
   - 支付金额建议以 BNB 为单位（除以 1e18）
   - 确保数值格式正确

5. **查询性能**：
   - 避免查询过大的时间范围
   - 建议使用索引字段（如 `block_time`）

6. **如何找到正确的表名**：
   - 在 Dune 查询编辑器中，点击左侧的 "Data" 或 "Tables" 按钮
   - 搜索 "BNB"、"BSC" 或 "Binance"
   - 查看可用的表，找到包含交易数据的表
   - 常见的表名可能是：`bnb.transactions`、`bsc.transactions`、`ethereum.transactions`（带 chain_id 过滤）

7. **地址格式（非常重要）**：
   - ✅ **正确**：`"to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90`（没有引号）
   - ❌ **错误**：`"to" = '0xa80447C2B2e958ae12105dba4BE9095557d1CC90'`（有引号）
   - 如果仍然报错，尝试：`"to" = varbinary('0xa80447C2B2e958ae12105dba4BE9095557d1CC90')`

8. **调试步骤（如果查询返回 0）**：
   ```sql
   -- 步骤 1: 验证合约地址是否有任何交易（注意：地址没有引号）
   SELECT COUNT(*) FROM bnb.transactions 
   WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90;
   
   -- 步骤 2: 查看最近的交易
   SELECT * FROM bnb.transactions 
   WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90
   ORDER BY block_time DESC LIMIT 5;
   
   -- 步骤 3: 检查时间范围
   SELECT MIN(block_time), MAX(block_time) 
   FROM bnb.transactions 
   WHERE "to" = 0xa80447C2B2e958ae12105dba4BE9095557d1CC90;
   ```

## 🔗 相关资源

- [Dune Analytics 官网](https://dune.com)
- [Dune SQL 文档](https://docs.dune.com/queries/dune-sql)
- [Dune 查询示例库](https://dune.com/browse/queries)
- [BSC 数据表文档](https://docs.dune.com/data-tables/blockchain/bnb-chain)

