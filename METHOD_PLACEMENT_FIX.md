# 方法定义位置修复

## 🐛 问题描述
控制台报错：`TypeError: this.updateComputedProperties is not a function`

## 🔍 问题原因
`updateComputedProperties` 方法被错误地定义在了组件对象的外部，而不是在 `methods` 对象内部。

### 错误的结构：
```javascript
Component({
  methods: {
    // 其他方法...
  },
  
  // ❌ 错误：方法定义在组件外部
  updateComputedProperties: function() {
    // ...
  }
})
```

### 正确的结构：
```javascript
Component({
  methods: {
    // 其他方法...
    
    // ✅ 正确：方法定义在 methods 内部
    updateComputedProperties: function() {
      // ...
    }
  }
})
```

## ✅ 解决方案

将 `updateComputedProperties` 方法移动到 `methods` 对象内部：

```javascript
methods: {
  // ...其他方法

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
    
    // 优化头像
    this.optimizeAvatarUrl()
  }
}
```

## 🎯 修复效果

- ✅ 方法可以正常调用
- ✅ 组件生命周期正常工作
- ✅ 数据监听器正常工作
- ✅ 操作按钮正确显示
- ✅ 菜品状态切换功能正常

## 📝 重要提醒

在微信小程序组件中，所有的自定义方法都必须定义在 `methods` 对象内部，否则无法通过 `this` 调用。

### 组件结构规范：
```javascript
Component({
  properties: { /* 属性定义 */ },
  data: { /* 数据定义 */ },
  methods: { 
    /* 所有自定义方法都在这里 */ 
  },
  lifetimes: { /* 生命周期方法 */ },
  pageLifetimes: { /* 页面生命周期方法 */ },
  observers: { /* 数据监听器 */ }
})
```