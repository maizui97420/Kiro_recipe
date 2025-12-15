# 统计分析功能数据库配置指南

## 🎯 概述
为了让统计分析功能正常工作，需要确保以下数据库集合存在并配置了适当的权限和索引。

## 📋 必需的数据库集合

### 1. 用户集合 (users) ✅
**状态**: 应该已存在
**用途**: 存储用户基本信息，统计分析需要获取成员昵称和头像

### 2. 群组集合 (groups) ✅  
**状态**: 应该已存在
**用途**: 存储群组信息和成员列表，统计分析需要验证用户权限

### 3. 菜品集合 (dishes) ✅
**状态**: 应该已存在  
**用途**: 存储菜品数据，这是统计分析的主要数据源

### 4. 操作日志集合 (activity_logs) ⚠️
**状态**: 可能需要新建
**用途**: 存储用户操作记录，用于"最近活动"统计

## 🚀 快速配置步骤

### 步骤1: 检查现有集合
1. 打开微信开发者工具
2. 点击"云开发" -> "数据库"
3. 检查是否存在以下集合：
   - ✅ users
   - ✅ groups  
   - ✅ dishes
   - ❓ activity_logs

### 步骤2: 创建缺失的集合

#### 如果缺少 activity_logs 集合：
1. 在数据库控制台点击"新建集合"
2. 集合名称：`activity_logs`
3. 点击"确定"创建

### 步骤3: 配置索引（重要！）

#### dishes 集合索引（统计分析核心）
```javascript
// 1. 群组+时间复合索引（用于按时间统计）
{
  "groupId": 1,
  "addTime": -1
}

// 2. 群组+状态复合索引（用于完成率统计）
{
  "groupId": 1,
  "status": 1
}

// 3. 群组+添加者复合索引（用于成员贡献统计）
{
  "groupId": 1,
  "addedBy": 1
}

// 4. 菜品名称索引（用于热门菜品统计）
{
  "name": 1
}
```

#### activity_logs 集合索引（如果新建了此集合）
```javascript
// 1. 群组+时间复合索引（用于最近活动）
{
  "groupId": 1,
  "timestamp": -1
}

// 2. 用户+时间复合索引（用于用户活跃度）
{
  "userId": 1,
  "timestamp": -1
}
```

### 步骤4: 配置权限规则

#### activity_logs 集合权限（如果新建了此集合）
```javascript
{
  "read": "get('database.groups.${doc.groupId}').members.indexOf(auth.openid) > -1",
  "write": false,
  "create": true,
  "delete": false
}
```

## 🔧 详细配置说明

### 创建 activity_logs 集合的详细步骤

1. **登录云开发控制台**
   - 微信开发者工具 -> 云开发 -> 数据库
   - 或访问：https://console.cloud.tencent.com/tcb

2. **新建集合**
   ```
   集合名称: activity_logs
   描述: 用户操作日志，用于统计分析
   ```

3. **创建索引**
   - 进入 activity_logs 集合详情
   - 点击"索引管理" -> "新建索引"
   - 按照上面的索引配置逐个创建

4. **设置权限**
   - 进入 activity_logs 集合详情  
   - 点击"权限设置"
   - 输入上面的权限规则

### 数据结构示例

#### activity_logs 文档结构
```javascript
{
  _id: "auto_generated_id",
  groupId: "group_id",           // 群组ID
  userId: "user_openid",         // 操作用户ID  
  action: "add_dish",            // 操作类型
  targetId: "dish_id",           // 目标对象ID
  timestamp: new Date(),         // 操作时间戳
  details: {                     // 操作详情
    dishName: "红烧肉",
    oldStatus: "pending",
    newStatus: "completed"
  }
}
```

#### 操作类型枚举
```javascript
const ACTION_TYPES = {
  ADD_DISH: 'add_dish',         // 添加菜品
  DELETE_DISH: 'delete_dish',   // 删除菜品  
  COMPLETE_DISH: 'complete_dish', // 完成菜品
  REOPEN_DISH: 'reopen_dish',   // 重新打开菜品
  JOIN_GROUP: 'join_group',     // 加入群组
  LEAVE_GROUP: 'leave_group'    // 离开群组
}
```

## 📊 统计功能数据依赖

### 基础统计数据
- **数据源**: dishes 集合
- **查询条件**: groupId + status
- **索引需求**: groupId + status 复合索引

### 成员贡献统计  
- **数据源**: dishes 集合 + users 集合
- **查询条件**: groupId + addedBy
- **索引需求**: groupId + addedBy 复合索引

### 热门菜品统计
- **数据源**: dishes 集合
- **查询条件**: groupId + name
- **索引需求**: name 索引

### 最近活动统计
- **数据源**: activity_logs 集合（优先）或 dishes 集合（备选）
- **查询条件**: groupId + timestamp
- **索引需求**: groupId + timestamp 复合索引

## ⚡ 性能优化建议

### 1. 索引优化
- 确保所有统计查询都使用了索引
- 复合索引的字段顺序要与查询条件匹配
- 避免创建过多不必要的索引

### 2. 查询优化
- 使用分页查询，避免一次性获取大量数据
- 在云函数中并行执行多个统计查询
- 缓存不经常变化的统计结果

### 3. 数据量控制
- activity_logs 集合可以定期清理旧数据
- 统计查询限制时间范围（如最近30天）
- 使用聚合查询减少数据传输量

## 🧪 测试验证

### 1. 数据库连接测试
```javascript
// 在统计页面或云函数中测试
const db = wx.cloud.database()
const testResult = await db.collection('dishes').limit(1).get()
console.log('数据库连接正常:', testResult.data.length >= 0)
```

### 2. 权限测试
```javascript
// 测试是否能正常读取群组菜品数据
const dishes = await db.collection('dishes')
  .where({ groupId: 'test_group_id' })
  .limit(5)
  .get()
console.log('权限配置正常:', dishes.data)
```

### 3. 索引效果测试
- 在云开发控制台查看查询性能
- 确保统计查询响应时间在可接受范围内
- 监控数据库读取次数是否合理

## 🚨 常见问题解决

### 问题1: 权限错误
**现象**: 统计页面显示"权限不足"或无法获取数据
**解决**: 检查集合权限规则，确保群组成员可以读取数据

### 问题2: 查询缓慢  
**现象**: 统计数据加载时间过长
**解决**: 检查索引配置，确保查询使用了正确的索引

### 问题3: activity_logs 数据为空
**现象**: "最近活动"部分没有数据
**解决**: 
- 如果是新建的集合，数据为空是正常的
- 可以手动添加一些测试数据
- 或者等待用户操作产生日志数据

## ✅ 配置完成检查清单

- [ ] 确认 users 集合存在且有数据
- [ ] 确认 groups 集合存在且有数据  
- [ ] 确认 dishes 集合存在且有数据
- [ ] 创建或确认 activity_logs 集合存在
- [ ] 为 dishes 集合创建必要的复合索引
- [ ] 为 activity_logs 集合创建索引（如果新建）
- [ ] 配置 activity_logs 集合权限（如果新建）
- [ ] 部署统计分析云函数
- [ ] 测试统计页面数据加载

完成以上配置后，统计分析功能就可以正常工作了！