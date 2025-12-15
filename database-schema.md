# 数据库架构文档

## 集合结构

### 1. 用户集合 (users)

```javascript
{
  _id: "auto_generated_id",
  openid: "wx_openid",           // 微信用户唯一标识
  appid: "wx_appid",             // 小程序ID
  unionid: "wx_unionid",         // 微信开放平台唯一标识
  nickName: "用户昵称",           // 用户昵称
  avatarUrl: "头像URL",          // 用户头像URL
  createTime: Date,              // 创建时间
  updateTime: Date,              // 更新时间
  currentGroupId: "group_id"     // 当前所在群组ID
}
```

**索引:**
- `openid` (唯一索引) - 用户身份验证
- `currentGroupId` - 查询用户当前群组
- `createTime` (降序) - 用户注册时间排序

### 2. 家庭群组集合 (groups)

```javascript
{
  _id: "auto_generated_id",
  name: "群组名称",              // 群组名称
  adminId: "admin_openid",       // 管理员用户ID
  inviteCode: "ABC123",          // 6位邀请码
  members: ["openid1", "openid2"], // 成员列表
  createTime: Date,              // 创建时间
  updateTime: Date               // 更新时间
}
```

**索引:**
- `inviteCode` (唯一索引) - 邀请码查找
- `adminId` - 管理员操作查询
- `members` - 成员关系查询
- `createTime` (降序) - 群组创建时间排序

### 3. 菜品集合 (dishes)

```javascript
{
  _id: "auto_generated_id",
  name: "菜品名称",              // 菜品名称
  groupId: "group_id",           // 所属群组ID
  addedBy: "user_openid",        // 添加者用户ID
  status: "pending|completed",   // 状态：待完成|已完成
  addTime: Date,                 // 添加时间
  completedTime: Date,           // 完成时间
  tags: ["tag1", "tag2"]         // 标签数组
}
```

**索引:**
- `groupId + addTime` (复合索引，降序) - 群组菜品按时间排序
- `addedBy` - 按添加者筛选
- `status` - 按状态筛选
- `groupId + status` (复合索引) - 群组内状态筛选
- `groupId + addedBy` (复合索引) - 群组内成员筛选
- `name` (升序索引) - 菜品名称排序和前缀匹配

### 4. 操作日志集合 (activity_logs)

```javascript
{
  _id: "auto_generated_id",
  groupId: "group_id",           // 群组ID
  userId: "user_openid",         // 操作用户ID
  action: "add_dish|delete_dish|complete_dish|join_group", // 操作类型
  targetId: "target_object_id",  // 目标对象ID
  timestamp: Date,               // 操作时间戳
  details: {                     // 操作详情
    dishName: "菜品名称",
    newStatus: "completed"
  }
}
```

**索引:**
- `groupId + timestamp` (复合索引，降序) - 群组操作日志时间排序
- `userId + timestamp` (复合索引，降序) - 用户操作历史
- `action` - 按操作类型筛选
- `targetId` - 目标对象关联查询

## 权限规则

### 用户集合权限
- **读取**: 用户只能读取自己的信息 (`auth.openid == doc.openid`)
- **写入**: 用户只能修改自己的信息 (`auth.openid == doc.openid`)
- **创建**: 允许创建用户记录 (`true`)
- **删除**: 不允许删除用户记录 (`false`)

### 群组集合权限
- **读取**: 只有群组成员可以读取 (`doc.members.indexOf(auth.openid) > -1`)
- **写入**: 只有管理员可以修改 (`doc.adminId == auth.openid`)
- **创建**: 允许创建群组 (`true`)
- **删除**: 只有管理员可以删除 (`doc.adminId == auth.openid`)

### 菜品集合权限
- **读取**: 群组成员可读 (`get('database.groups.${doc.groupId}').members.indexOf(auth.openid) > -1`)
- **写入**: 只能修改自己添加的菜品 (`doc.addedBy == auth.openid`)
- **创建**: 群组成员可创建 (`get('database.groups.${doc.groupId}').members.indexOf(auth.openid) > -1`)
- **删除**: 只能删除自己添加的菜品 (`doc.addedBy == auth.openid`)

### 操作日志集合权限
- **读取**: 群组成员可读 (`get('database.groups.${doc.groupId}').members.indexOf(auth.openid) > -1`)
- **写入**: 不允许直接修改日志 (`false`)
- **创建**: 允许创建日志（通过云函数） (`true`)
- **删除**: 不允许删除日志 (`false`)

## 数据完整性约束

### 必填字段
- **用户**: `openid`, `nickName`, `createTime`
- **群组**: `name`, `adminId`, `inviteCode`, `members`, `createTime`
- **菜品**: `name`, `groupId`, `addedBy`, `status`, `addTime`
- **日志**: `groupId`, `userId`, `action`, `timestamp`

### 数据验证规则
- 邀请码必须是6位大写字母和数字组合
- 菜品名称不能为空或仅包含空白字符
- 用户openid必须符合微信格式
- 状态字段只能是预定义的枚举值

### 关联完整性
- 菜品的`groupId`必须存在于groups集合中
- 菜品的`addedBy`必须存在于users集合中
- 群组的`members`数组中的用户ID必须存在于users集合中
- 操作日志的`groupId`和`userId`必须存在于对应集合中

## 云数据库建立步骤

### 1. 登录微信开发者工具

1. 打开微信开发者工具
2. 选择你的小程序项目
3. 点击顶部菜单栏的"云开发"按钮
4. 如果是第一次使用，需要开通云开发服务

### 2. 进入云开发控制台

1. 在微信开发者工具中点击"云开发"
2. 选择"云开发控制台"
3. 或者直接访问：https://console.cloud.tencent.com/tcb
4. 选择对应的环境（开发/生产）

### 3. 创建数据库集合

#### 3.1 创建用户集合 (users)

```bash
# 在云开发控制台 -> 数据库 -> 集合管理
1. 点击"新建集合"
2. 集合名称：users
3. 点击"确定"创建
```

**创建索引：**
```javascript
// 在集合详情页面 -> 索引管理 -> 新建索引
// 索引1：openid唯一索引
{
  "openid": 1
}
// 设置为唯一索引

// 索引2：currentGroupId索引
{
  "currentGroupId": 1
}

// 索引3：createTime降序索引
{
  "createTime": -1
}
```

#### 3.2 创建家庭群组集合 (groups)

```bash
1. 点击"新建集合"
2. 集合名称：groups
3. 点击"确定"创建
```

**创建索引：**
```javascript
// 索引1：inviteCode唯一索引
{
  "inviteCode": 1
}
// 设置为唯一索引

// 索引2：adminId索引
{
  "adminId": 1
}

// 索引3：members数组索引
{
  "members": 1
}

// 索引4：createTime降序索引
{
  "createTime": -1
}
```

#### 3.3 创建菜品集合 (dishes)

```bash
1. 点击"新建集合"
2. 集合名称：dishes
3. 点击"确定"创建
```

**创建索引：**
```javascript
// 索引1：groupId + addTime复合索引
{
  "groupId": 1,
  "addTime": -1
}

// 索引2：addedBy索引
{
  "addedBy": 1
}

// 索引3：status索引
{
  "status": 1
}

// 索引4：groupId + status复合索引
{
  "groupId": 1,
  "status": 1
}

// 索引5：groupId + addedBy复合索引
{
  "groupId": 1,
  "addedBy": 1
}

// 索引6：name升序索引（用于菜品名称排序和前缀匹配）
{
  "name": 1
}
```

#### 3.4 创建操作日志集合 (activity_logs)

```bash
1. 点击"新建集合"
2. 集合名称：activity_logs
3. 点击"确定"创建
```

**创建索引：**
```javascript
// 索引1：groupId + timestamp复合索引
{
  "groupId": 1,
  "timestamp": -1
}

// 索引2：userId + timestamp复合索引
{
  "userId": 1,
  "timestamp": -1
}

// 索引3：action索引
{
  "action": 1
}

// 索引4：targetId索引
{
  "targetId": 1
}
```

### 4. 设置数据库权限规则

#### 4.1 用户集合权限设置

```javascript
// 在集合详情页面 -> 权限设置
{
  "read": "auth.openid == doc.openid",
  "write": "auth.openid == doc.openid", 
  "create": true,
  "delete": false
}
```

#### 4.2 群组集合权限设置

```javascript
{
  "read": "doc.members.indexOf(auth.openid) > -1",
  "write": "doc.adminId == auth.openid",
  "create": true,
  "delete": "doc.adminId == auth.openid"
}
```

#### 4.3 菜品集合权限设置

```javascript
{
  "read": "get('database.groups.${doc.groupId}').members.indexOf(auth.openid) > -1",
  "write": "doc.addedBy == auth.openid",
  "create": "get('database.groups.${doc.groupId}').members.indexOf(auth.openid) > -1",
  "delete": "doc.addedBy == auth.openid"
}
```

#### 4.4 操作日志集合权限设置

```javascript
{
  "read": "get('database.groups.${doc.groupId}').members.indexOf(auth.openid) > -1",
  "write": false,
  "create": true,
  "delete": false
}
```

### 5. 验证集合创建

#### 5.1 检查集合列表
```bash
# 在云开发控制台 -> 数据库 -> 集合管理
确认以下集合已创建：
- users
- groups  
- dishes
- activity_logs
```

#### 5.2 测试数据插入
```javascript
// 可以在控制台手动插入测试数据验证
// 用户测试数据
{
  "openid": "test_openid_001",
  "nickName": "测试用户",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createTime": new Date(),
  "updateTime": new Date()
}

// 群组测试数据
{
  "name": "测试家庭",
  "adminId": "test_openid_001", 
  "inviteCode": "ABC123",
  "members": ["test_openid_001"],
  "createTime": new Date(),
  "updateTime": new Date()
}
```

### 6. 环境配置

#### 6.1 开发环境配置
```bash
# 确保 cloudfunctions/config/development.json 中包含正确的环境ID
{
  "env": "your-dev-env-id"
}
```

#### 6.2 生产环境配置  
```bash
# 确保 cloudfunctions/config/production.json 中包含正确的环境ID
{
  "env": "your-prod-env-id"
}
```

### 7. 菜品搜索功能实现

由于微信云开发不支持文本索引，菜品搜索需要使用以下策略：

#### 7.1 基本搜索实现
```javascript
// 在群组内搜索菜品（推荐方式）
const searchDishes = async (groupId, keyword) => {
  const db = wx.cloud.database();
  return await db.collection('dishes')
    .where({
      groupId: groupId,
      name: db.RegExp({
        regexp: keyword,
        options: 'i'  // 不区分大小写
      })
    })
    .orderBy('addTime', 'desc')
    .limit(20)
    .get();
};
```

#### 7.2 优化搜索性能
```javascript
// 使用复合查询条件
const searchDishesOptimized = async (groupId, keyword, status = null) => {
  const db = wx.cloud.database();
  let whereCondition = {
    groupId: groupId,
    name: db.RegExp({
      regexp: keyword,
      options: 'i'
    })
  };
  
  if (status) {
    whereCondition.status = status;
  }
  
  return await db.collection('dishes')
    .where(whereCondition)
    .orderBy('addTime', 'desc')
    .limit(20)
    .get();
};
```

#### 7.3 前端搜索优化
- 实现防抖功能，避免频繁查询
- 设置最小搜索字符数（如2个字符以上才搜索）
- 缓存搜索结果，相同关键词不重复查询

### 8. 常见问题排查

#### 8.1 权限问题
- 确保用户已登录并获得openid
- 检查权限规则语法是否正确
- 验证集合间的关联查询权限

#### 8.2 索引问题
- 复合索引的字段顺序很重要
- 微信云开发只支持升序(1)、降序(-1)、地理位置索引
- 确保查询使用了正确的索引

#### 8.3 性能问题
- 避免不使用索引的查询
- 合理设置分页大小
- 监控数据库读写次数
- 搜索功能要限制在群组范围内

## 性能优化建议

### 查询优化
1. 使用复合索引优化常见查询组合
2. 避免全表扫描，始终使用索引字段作为查询条件
3. 对于菜品名称搜索，使用正则表达式进行模糊匹配，但要限制在群组范围内以提高性能
4. 菜品搜索建议使用 `db.collection('dishes').where({groupId: 'xxx', name: db.RegExp({regexp: 'keyword', options: 'i'})})` 的方式

### 数据分页
1. 菜品列表查询使用时间戳分页
2. 操作日志使用时间戳分页
3. 避免使用skip进行深度分页

### 缓存策略
1. 群组信息可以在客户端缓存
2. 用户信息在登录后缓存
3. 菜品列表使用实时监听更新