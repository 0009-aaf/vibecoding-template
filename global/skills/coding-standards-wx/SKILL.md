---
name: coding-standards-wx
description: 微信小程序编码规范。Agent 操作 .wxml/.wxss/小程序项目文件时自动加载。
---

# 微信小程序编码规范

## 触发条件

Agent 操作 `.wxml` / `.wxss` / 小程序项目文件时自动加载。

## 微信小程序 (16 条)

| # | 规则 |
|---|------|
| WX1 | 页面上线年份用 `appStartYear` 常量（`app.globalData`），WXML中通过数据绑定引用 |
| WX2 | `scroll-view` 的 `refresher-triggered` 绑定独立的 `refreshing` 字段，与 `loading` 分离 |
| WX3 | `data` 中所有字段必须初始声明，依赖 `setData` 更新已有字段（确保首次渲染字段存在） |
| WX4 | 废弃组件/页面及时删除，保留空壳 `Component({})` 会增加包体积 |
| WX5 | `setData` 批量更新：合并多次调用为一次，减少通信开销；路径化更新（`list[0].name`） |
| WX6 | 图片用 `<image mode>` 按比例裁剪；列表图用 lazy-load；大图先压缩再上传 |
| WX7 | 网络请求封装统一拦截器：loading态、错误处理、token注入、超时重试 |
| WX8 | 页面栈深度≤10；复杂流程用 `redirectTo` 替代 `navigateTo` 控制栈深度 |
| WX9 | `tabBar` 图标用 81x81px PNG（非透明背景）；自定义 tabBar 需处理安全区 |
| WX10 | 分包加载：主包≤2MB；总包≤20MB；按页面维度分包；公共组件入主包 |
| WX11 | 事件绑定用 `bind:tap` 冒泡绑定，`catch:tap` 阻止冒泡；按需选择 |
| WX12 | `WXS` 用于格式化显示数据（日期/金额/状态映射），减少 setData 通信 |
| WX13 | 组件通信：父传子用 properties，子传父用 triggerEvent，跨组件用事件总线或全局状态 |
| WX14 | `onLoad` 获取参数，`onShow` 刷新数据，`onHide` 暂停定时器/监听 |
| WX15 | 分享配置：`onShareAppMessage` 返回 title+path+imageUrl；朋友圈用 `onShareTimeline` |
| WX16 | 权限申请按需触发：相册/相机/位置在用户操作时请求，附带用途说明 |
