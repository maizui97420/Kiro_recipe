# 统计分析功能数据库快速配置

## 🚀 一键配置方案

### 方案1: 使用数据库初始化云函数（推荐）

1. **部署数据库初始化云函数**
   ```bash
   # 在微信开发者工具中
   右键点击 cloudfunctions/database-init/ 文件夹
   选择 "上传并部署：云端安装依赖"
   ```

2. **运行数据库检查**
   ```javascript
   // 在小程序中调用云函数检查数据库状态
   wx.cloud.callFunction({
     name: 'database-init',
     data: { action: 'checkStatisticsSetup' },
     success: (res) => {
       console.log('数据库检查结果:', res.result)
     }
   })
   ```

3. **创建示例数据（可选）**
   ```javascript
   // 如果需要测试数据，可以创建示例数据
   wx.cloud.callFunction({
     name: 'database-init', 
     data: { action: 'createStatisticsSampleData' },
     success: (res) => {
       console.log('示例数据创建结果:', res.result)
     }
   })
   ```

### 方案2: 手动配置（详细控制）

#### 步骤1: 检查现有集合
在云开发控制台 -> 数据库中检查以下集合是否存在：
- ✅ users（用户信息）
- ✅ groups（群组信息）  
- ✅ dishes（菜品数据）
- ❓ activity_logs（操作日志，可选）

#### 步骤2: 创建缺失集合
如果 `activity_logs` 集合不存在：
1. 在数据库控制台点击"新建集合"
2. 集合名称：`activity_logs`
3. 点击"确定"

#### 步骤3: 创建关键索引
为 `dishes` 集合创建以下索引（统计分析必需）：

```javascript
// 1. 群组+时间索引（基础统计）
{
  "groupId": 1,
  "addTime": -1
}

// 2. 群组+状态索引（完成率统计）
{
  "groupId": 1,
  "status": 1
}

// 3. 群组+添加者索引（成员贡献统计）
{
  "groupId": 1,
  "addedBy": 1
}

// 4. 菜品名称索引（热门菜品统计）
{
  "name": 1
}
```

为 `activity_logs` 集合创建索引（如果存在）：
```javascript
// 群组+时间索引（最近活动）
{
  "groupId": 1,
  "timestamp": -1
}
```

#### 步骤4: 配置权限
为 `activity_logs` 集合设置权限（如果新建）：
```javascript
{
  "read": "get('database.groups.${doc.groupId}').members.indexOf(auth.openid) > -1",
  "write": false,
  "create": true,
  "delete": false
}
```

## 🔍 配置验证

### 验证方法1: 使用云函数检查
```javascript
wx.cloud.callFunction({
  name: 'database-init',
  data: { action: 'checkStatisticsSetup' },
  success: (res) => {
    const { collections, sampleData, recommendations } = res.result.data
    
    console.log('集合状态:', collections)
    console.log('示例数据:', sampleData) 
    console.log('配置建议:', recommendations)
  }
})
```

### 验证方法2: 直接测试统计页面
1. 部署 `statistics` 云函数
2. 访问统计分析页面
3. 检查是否显示"📊 实时数据"还是"🧪 模拟数据"

## 📊 数据结构说明

### activity_logs 集合结构
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

### 支持的操作类型
- `add_dish` - 添加菜品
- `delete_dish` - 删除菜品
- `complete_dish` - 完成菜品
- `reopen_dish` - 重新打开菜品
- `join_group` - 加入群组
- `leave_group` - 离开群组

## ⚡ 性能优化建议

### 1. 索引优化
- 确保所有统计查询都使用了索引
- 复合索引的字段顺序要与查询条件匹配
- 定期检查索引使用情况

### 2. 查询优化
- 统计查询限制在群组范围内
- 使用分页避免大量数据传输
- 并行执行多个统计查询

### 3. 缓存策略
- 缓存不经常变化的统计结果
- 使用实时监听减少轮询查询
- 合理设置缓存过期时间

## 🚨 常见问题

### Q: 统计页面显示"🧪 模拟数据"
**A**: 这表示云函数调用失败，可能原因：
- statistics 云函数未部署
- 数据库权限配置错误
- 网络连接问题

### Q: "最近活动"部分为空
**A**: 可能原因：
- activity_logs 集合不存在（正常，会使用备选方案）
- 集合存在但没有数据（新建集合的正常状态）
- 权限配置错误

### Q: 成员贡献统计不准确
**A**: 检查以下配置：
- dishes 集合的 groupId + addedBy 索引
- users 集合的数据完整性
- 群组成员列表是否正确

### Q: 热门菜品统计为空
**A**: 可能原因：
- dishes 集合没有数据
- 菜品名称字段为空
- name 索引未创建

## ✅ 配置完成检查清单

- [ ] 部署 database-init 云函数
- [ ] 部署 statistics 云函数  
- [ ] 运行数据库配置检查
- [ ] 确认所有必需集合存在
- [ ] 创建关键索引
- [ ] 配置集合权限
- [ ] 测试统计页面功能
- [ ] 验证数据显示正确

完成以上步骤后，统计分析功能就可以完全正常工作了！

## 🎯 下一步操作

1. **立即执行**: 部署 `database-init` 和 `statistics` 云函数
2. **验证配置**: 运行 `checkStatisticsSetup` 检查数据库状态
3. **测试功能**: 访问统计分析页面验证功能
4. **优化性能**: 根据实际使用情况调整索引和缓存策略