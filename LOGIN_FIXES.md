# 登录和首页问题修复

## 🎉 已修复的问题

### 1. 首页重复加载问题 ✅
**问题**：登录成功后，首页不断重新加载，在登录页和首页之间循环跳转

**原因**：
- `onShow` 方法在每次页面显示时都会检查登录状态
- 如果检测到未登录，会跳转到登录页
- 登录成功后回到首页，又触发 `onShow`，形成循环

**修复**：
- 移除了 `onShow` 方法中的 `checkUserLogin()` 调用
- 只在 `onLoad` 时检查登录状态
- 登录成功后正确设置 `app.globalData.isLoggedIn = true`

### 2. add-dish 组件 groupId 为 null 问题 ✅
**问题**：控制台显示 `groupId` 属性收到 `null` 值的警告

**原因**：
- 首页使用 `userInfo.currentGroupId` 传递给组件
- 但用户信息中的 `currentGroupId` 可能为 null
- 组件期望接收字符串类型

**修复**：
- 改为使用 `currentGroup._id` 传递 groupId
- 初始化 `currentGroup` 为 `{ _id: '' }` 而不是 `null`
- 在组件中添加了 observer 来处理 groupId 变化

### 3. 登录状态管理问题 ✅
**问题**：登录成功后全局状态不一致

**修复**：
- 登录成功后正确设置 `app.globalData.isLoggedIn = true`
- 确保用户信息正确保存到全局状态

## 🔧 具体修改

### pages/index/index.js
```javascript
// 修复重复加载
onShow: function () {
  const app = getApp();
  if (app.globalData.isLoggedIn) {
    this.setData({ userInfo: app.globalData.userInfo });
    this.loadUserData();
  }
  // 移除了 else 分支，避免循环跳转
},

// 修复初始数据
data: {
  currentGroup: { _id: '' }, // 不再是 null
  // ...其他属性
}
```

### pages/index/index.wxml
```xml
<!-- 修复 groupId 传递 -->
<add-dish 
  group-id="{{currentGroup._id}}"
  visible="{{showAddModal}}"
  bind:success="onAddDishSuccess"
  bind:error="onAddDishError"
  bind:cancel="onAddDishCancel"
></add-dish>
```

### pages/login/login.js
```javascript
// 修复登录状态设置
const app = getApp()
app.globalData.userInfo = res.result.data
app.globalData.isLoggedIn = true  // 新增这行
```

### components/add-dish/add-dish.js
```javascript
// 添加 observer 处理 groupId 变化
properties: {
  groupId: {
    type: String,
    value: '',
    observer: function(newVal, oldVal) {
      if (newVal && this.data.errorMessage === '群组信息缺失') {
        this.setData({ errorMessage: '' })
      }
    }
  },
}
```

## 🧪 测试建议

1. **登录流程测试**：
   - 清除小程序数据
   - 重新登录
   - 确认不会出现循环跳转

2. **首页功能测试**：
   - 检查用户信息显示正常
   - 确认快速添加菜品功能可用
   - 验证不再有 groupId 警告

3. **组件交互测试**：
   - 测试添加菜品组件的显示和隐藏
   - 确认组件能正确接收 groupId

## 🎯 预期结果

- ✅ 登录成功后直接进入首页，不再循环跳转
- ✅ 控制台不再显示 groupId 类型警告
- ✅ 首页加载流畅，用户体验良好
- ✅ 添加菜品功能正常工作