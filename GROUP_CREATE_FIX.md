# 创建群组按钮修复

## 🐛 问题描述
在创建群组对话框中，输入群组名称后，创建按钮仍然显示为灰色且无法点击。

## 🔍 问题原因
在 WXML 模板中使用了 JavaScript 方法 `trim()`：
```wxml
disabled="{{isCreatingGroup || !newGroupName.trim()}}"
```

**微信小程序的 WXML 不支持直接调用 JavaScript 方法**，所以 `newGroupName.trim()` 无法正确执行，导致按钮始终处于禁用状态。

## ✅ 解决方案

### 1. 添加计算属性
在 `data` 中添加了两个布尔值来控制按钮状态：
```javascript
data: {
  // ...其他属性
  canCreateGroup: false,  // 是否可以创建群组
  canJoinGroup: false     // 是否可以加入群组
}
```

### 2. 在输入事件中计算状态
```javascript
// 群组名称输入
onGroupNameInput: function(e) {
  const value = e.detail.value;
  this.setData({ 
    newGroupName: value,
    canCreateGroup: value.trim().length > 0  // 在 JS 中计算
  });
},

// 邀请码输入
onInviteCodeInput: function(e) {
  const value = e.detail.value;
  this.setData({ 
    inviteCode: value,
    canJoinGroup: value.trim().length > 0   // 在 JS 中计算
  });
}
```

### 3. 更新 WXML 模板
```wxml
<!-- 创建群组按钮 -->
<button 
  class="modal-btn confirm" 
  bindtap="createGroup"
  disabled="{{isCreatingGroup || !canCreateGroup}}"
>
  {{isCreatingGroup ? '创建中...' : '创建'}}
</button>

<!-- 加入群组按钮 -->
<button 
  class="modal-btn confirm" 
  bindtap="joinGroup"
  disabled="{{isJoiningGroup || !canJoinGroup}}"
>
  {{isJoiningGroup ? '加入中...' : '加入'}}
</button>
```

### 4. 初始化状态
在显示模态框时重置状态：
```javascript
showCreateGroupModal: function() {
  this.setData({ 
    showCreateModal: true,
    newGroupName: '',
    canCreateGroup: false  // 初始状态为不可创建
  });
}
```

## 🎯 修复效果

- ✅ 输入群组名称后，创建按钮立即变为可点击状态
- ✅ 清空输入内容后，按钮自动变为禁用状态
- ✅ 同样修复了加入群组的邀请码输入问题
- ✅ 按钮状态响应及时，用户体验良好

## 📝 技术要点

1. **WXML 限制**：不能在模板中直接调用 JavaScript 方法
2. **数据驱动**：通过 `setData` 更新计算后的布尔值
3. **实时响应**：在 `input` 事件中实时计算按钮状态
4. **状态管理**：确保模态框打开时状态正确初始化

## 🧪 测试建议

1. **创建群组测试**：
   - 打开创建群组对话框，确认按钮初始为禁用状态
   - 输入群组名称，确认按钮变为可点击
   - 清空输入，确认按钮重新禁用

2. **加入群组测试**：
   - 打开加入群组对话框，确认按钮初始为禁用状态
   - 输入邀请码，确认按钮变为可点击
   - 清空输入，确认按钮重新禁用

3. **边界情况测试**：
   - 输入只有空格的内容，确认按钮保持禁用
   - 输入有效内容后再删除，确认状态正确切换