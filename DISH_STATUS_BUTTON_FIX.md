# 菜品状态按钮修复

## 🐛 问题描述
点击菜品的状态切换按钮（✓ 或 ↻）时没有反应，控制台显示收到数据变更但 `docChanges` 和 `docs` 为空数组。

## 🔍 问题原因
在 `dish-item` 组件的 WXML 中使用了方法调用：

```wxml
<!-- 问题代码 -->
<view class="dish-actions" wx:if="{{canManageDish()}}">
<text class="dish-author">{{getAddedByUser().nickName}}</text>
<text class="dish-time">{{formatTime(dish.addTime)}}</text>
```

**微信小程序的 WXML 不支持直接调用组件方法**，这导致：
1. 操作按钮不显示（`canManageDish()` 返回 undefined）
2. 用户信息和时间显示异常
3. 无法点击状态切换按钮

## ✅ 解决方案

### 1. 添加计算属性
在组件的 `data` 中添加计算后的属性：

```javascript
data: {
  // ...其他属性
  canManage: false,     // 是否可以管理此菜品
  addedByUser: {},      // 添加者信息
  formattedTime: ''     // 格式化的时间
}
```

### 2. 添加计算方法
```javascript
// 更新计算属性
updateComputedProperties: function() {
  const { dish, groupMembers, userInfo } = this.properties
  
  if (!dish || !groupMembers || !userInfo) return
  
  // 计算是否可以管理
  const canManage = dish.addedBy === userInfo.openid
  
  // 获取添加者信息
  const addedByUser = groupMembers.find(member => member.openid === dish.addedBy) || { 
    nickName: '未知用户',
    openid: dish.addedBy,
    avatarUrl: ''
  }
  
  // 格式化时间
  const formattedTime = this.formatTime(dish.addTime)
  
  this.setData({
    canManage: canManage,
    addedByUser: addedByUser,
    formattedTime: formattedTime
  })
}
```

### 3. 添加数据监听器
```javascript
observers: {
  'dish, groupMembers, userInfo': function(dish, groupMembers, userInfo) {
    if (dish && groupMembers && userInfo) {
      this.updateComputedProperties()
    }
  }
}
```

### 4. 更新 WXML 模板
```wxml
<!-- 修复前 -->
<view class="dish-actions" wx:if="{{canManageDish()}}">
<text class="dish-author">{{getAddedByUser().nickName}}</text>
<text class="dish-time">{{formatTime(dish.addTime)}}</text>

<!-- 修复后 -->
<view class="dish-actions" wx:if="{{canManage}}">
<text class="dish-author">{{addedByUser.nickName}}</text>
<text class="dish-time">{{formattedTime}}</text>
```

## 🎯 修复效果

### 修复前
- ❌ 操作按钮不显示
- ❌ 无法点击状态切换
- ❌ 用户信息显示异常
- ❌ 时间显示异常

### 修复后
- ✅ 操作按钮正常显示
- ✅ 可以点击 ✓ 和 ↻ 按钮
- ✅ 用户信息正确显示
- ✅ 时间格式化正常
- ✅ 权限检查正常工作

## 📝 技术要点

1. **WXML 限制**：不能在模板中直接调用组件方法
2. **数据驱动**：所有显示逻辑都应该通过数据绑定实现
3. **计算属性**：复杂逻辑在 JS 中计算，结果存储在 data 中
4. **响应式更新**：使用 observers 监听属性变化并更新计算属性

## 🧪 测试步骤

1. **检查按钮显示**：
   - 自己添加的菜品应该显示操作按钮
   - 他人添加的菜品不显示操作按钮

2. **测试状态切换**：
   - 点击 ✓ 按钮将"待完成"变为"已完成"
   - 点击 ↻ 按钮将"已完成"变为"待完成"

3. **验证权限控制**：
   - 只能操作自己添加的菜品
   - 操作他人菜品时显示权限提示

4. **检查信息显示**：
   - 添加者昵称正确显示
   - 时间格式化正确
   - 头像正常加载

## 🔗 相关问题

这个问题与之前修复的问题类似：
- 群组创建按钮：WXML 中使用了 `trim()` 方法
- 添加菜品按钮：WXML 中使用了 `trim()` 方法
- 菜品状态按钮：WXML 中使用了组件方法调用

**共同解决方案**：将所有 JavaScript 逻辑移到 JS 文件中处理，通过数据绑定传递给 WXML。

## 🎉 预期结果

修复后，菜品状态切换功能应该完全正常：
- 操作按钮正确显示
- 点击按钮有响应
- 状态正确更新
- 实时同步到其他成员
- 权限控制正常工作