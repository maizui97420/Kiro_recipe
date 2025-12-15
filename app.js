// app.js
App({
  onLaunch() {
    // 记录启动时间
    const launchStartTime = Date.now();
    
    // 初始化性能监控
    this.initPerformanceMonitoring();
    
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      this.showError('请更新微信版本以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-4gbp56ej405f4269', // 请替换为你的云开发环境ID
        // 暂时不指定环境ID，使用默认环境
        traceUser: true,
      });
    }

    // 获取系统信息
    this.initSystemInfo();
    
    // 检查用户登录状态
    this.checkLoginStatus();
    
    // 初始化全局错误监听
    this.initErrorHandlers();
    
    // 记录启动完成时间
    const launchTime = Date.now() - launchStartTime;
    console.log(`小程序启动耗时: ${launchTime}ms`);
    this.globalData.performanceMetrics.launchTime = launchTime;
  },

  onShow() {
    // 小程序显示时的处理
    console.log('小程序显示');
    
    // 检查网络状态
    this.checkNetworkStatus();
    
    // 如果用户已登录，刷新用户信息
    if (this.globalData.isLoggedIn) {
      this.refreshUserInfo();
    }
  },

  onHide() {
    // 小程序隐藏时的处理
    console.log('小程序隐藏');
    
    // 保存当前状态到本地存储
    this.saveAppState();
  },

  onError(error) {
    // 小程序错误处理
    console.error('小程序发生错误:', error);
    this.handleGlobalError(error);
  },

  // 初始化系统信息
  initSystemInfo() {
    try {
      this.globalData.systemInfo = wx.getSystemInfoSync();
      console.log('系统信息:', this.globalData.systemInfo);
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }
  },

  // 初始化错误处理器
  initErrorHandlers() {
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.globalData.networkStatus = res;
      if (!res.isConnected) {
        this.showError('网络连接已断开');
      } else {
        console.log('网络已连接:', res.networkType);
      }
    });

    // 监听内存不足警告
    wx.onMemoryWarning((res) => {
      console.warn('内存不足警告:', res.level);
      this.handleMemoryWarning(res.level);
    });
  },

  // 检查网络状态
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        this.globalData.networkStatus = {
          isConnected: res.networkType !== 'none',
          networkType: res.networkType
        };
        
        if (res.networkType === 'none') {
          this.showError('当前无网络连接');
        }
      },
      fail: (error) => {
        console.error('获取网络状态失败:', error);
      }
    });
  },

  // 检查用户登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const currentGroupId = wx.getStorageSync('currentGroupId');
    
    if (userInfo && userInfo.openid) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      this.globalData.currentGroupId = currentGroupId;
      console.log('用户已登录:', userInfo.nickName);
    } else {
      this.globalData.isLoggedIn = false;
      this.globalData.currentGroupId = null;
      console.log('用户未登录');
    }
  },

  // 刷新用户信息
  refreshUserInfo() {
    if (!this.globalData.isLoggedIn) return;
    
    // 这里可以调用云函数获取最新的用户信息
    // 暂时保持现有逻辑
  },

  // 保存应用状态
  saveAppState() {
    try {
      if (this.globalData.userInfo) {
        wx.setStorageSync('userInfo', this.globalData.userInfo);
      }
      if (this.globalData.currentGroupId) {
        wx.setStorageSync('currentGroupId', this.globalData.currentGroupId);
      }
    } catch (error) {
      console.error('保存应用状态失败:', error);
    }
  },

  // 处理内存警告
  handleMemoryWarning(level) {
    if (level >= 10) {
      // 严重内存不足，清理缓存
      this.clearCache();
      this.showError('内存不足，已清理缓存');
    }
  },

  // 清理缓存
  clearCache() {
    try {
      // 清理非必要的本地存储
      const keysToKeep = ['userInfo', 'currentGroupId'];
      const storageInfo = wx.getStorageInfoSync();
      
      storageInfo.keys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          wx.removeStorageSync(key);
        }
      });
      
      console.log('缓存清理完成');
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  },

  // 全局数据
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    currentGroupId: null,
    systemInfo: null,
    networkStatus: null,
    appVersion: '1.0.0',
    // 性能配置
    performanceConfig: {
      enableMonitoring: true,
      maxCacheSize: 50,
      imageQuality: 0.8,
      paginationLimit: 20,
      enableImageOptimization: true,
      enableLazyLoading: true
    },
    // 性能指标
    performanceMetrics: {
      launchTime: 0,
      pageLoadTimes: {},
      networkRequestTimes: {},
      memoryUsage: 0,
      cacheHitRate: 0
    }
  },

  // 获取系统信息
  getSystemInfo() {
    if (!this.globalData.systemInfo) {
      this.globalData.systemInfo = wx.getSystemInfoSync();
    }
    return this.globalData.systemInfo;
  },

  // 显示加载提示
  showLoading(title = '加载中...', mask = true) {
    wx.showLoading({
      title: title,
      mask: mask
    });
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading();
  },

  // 显示增强的加载提示
  showEnhancedLoading(options = {}) {
    const defaultOptions = {
      title: '加载中...',
      mask: true,
      duration: 0
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    wx.showLoading({
      title: finalOptions.title,
      mask: finalOptions.mask
    });
    
    // 如果设置了持续时间，自动隐藏
    if (finalOptions.duration > 0) {
      setTimeout(() => {
        this.hideLoading();
      }, finalOptions.duration);
    }
  },

  // 显示成功提示
  showSuccess(title, duration = 2000) {
    wx.showToast({
      title: title,
      icon: 'success',
      duration: duration
    });
  },

  // 显示增强的成功提示
  showEnhancedSuccess(title, options = {}) {
    const defaultOptions = {
      icon: 'success',
      duration: 2000,
      mask: false
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    wx.showToast({
      title: title,
      icon: finalOptions.icon,
      duration: finalOptions.duration,
      mask: finalOptions.mask
    });
    
    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  // 显示错误提示
  showError(title) {
    wx.showToast({
      title: title,
      icon: 'error',
      duration: 2000
    });
  },

  // 全局错误处理
  handleGlobalError(error) {
    console.error('全局错误:', error);
    
    let message = '应用发生错误，请重试';
    
    // 根据错误类型提供更具体的提示
    if (typeof error === 'string') {
      if (error.includes('network')) {
        message = '网络连接异常，请检查网络设置';
      } else if (error.includes('permission')) {
        message = '权限不足，请重新登录';
      }
    }
    
    this.showError(message);
    
    // 记录错误日志（可以发送到服务器）
    this.logError(error);
  },

  // 网络错误处理
  handleNetworkError(error) {
    console.error('网络错误:', error);
    let message = '网络连接失败，请检查网络设置';
    
    if (error && error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        message = '网络连接超时，请重试';
      } else if (error.errMsg.includes('fail')) {
        message = '网络请求失败，请重试';
      } else if (error.errMsg.includes('abort')) {
        message = '请求被取消';
      }
    }
    
    this.showError(message);
    return false; // 表示错误已处理
  },

  // 云函数调用错误处理
  handleCloudError(error) {
    console.error('云函数错误:', error);
    let message = '服务器繁忙，请稍后重试';
    
    if (error && error.errCode) {
      switch (error.errCode) {
        case -1:
          message = '系统错误，请稍后重试';
          break;
        case -2:
          message = '网络错误，请检查网络连接';
          break;
        case 87009:
          message = '权限不足，请重新登录';
          break;
        default:
          message = error.errMsg || '服务器繁忙，请稍后重试';
      }
    }
    
    this.showError(message);
    return false;
  },

  // 记录错误日志
  logError(error) {
    try {
      const errorLog = {
        error: error.toString(),
        timestamp: new Date().toISOString(),
        userAgent: this.globalData.systemInfo?.system || 'unknown',
        version: this.globalData.appVersion
      };
      
      // 保存到本地，后续可以上传到服务器
      let errorLogs = wx.getStorageSync('errorLogs') || [];
      errorLogs.push(errorLog);
      
      // 只保留最近50条错误日志
      if (errorLogs.length > 50) {
        errorLogs = errorLogs.slice(-50);
      }
      
      wx.setStorageSync('errorLogs', errorLogs);
    } catch (e) {
      console.error('记录错误日志失败:', e);
    }
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    
    try {
      wx.setStorageSync('userInfo', userInfo);
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  },

  // 设置当前群组
  setCurrentGroup(groupId) {
    this.globalData.currentGroupId = groupId;
    
    try {
      wx.setStorageSync('currentGroupId', groupId);
    } catch (error) {
      console.error('保存群组信息失败:', error);
    }
  },

  // 退出登录
  logout() {
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    this.globalData.currentGroupId = null;
    
    try {
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('currentGroupId');
    } catch (error) {
      console.error('清除登录信息失败:', error);
    }
  },

  // 通用云函数调用方法（增强版本，包含性能监控）
  callCloudFunction(name, data = {}) {
    return new Promise((resolve, reject) => {
      const requestStartTime = Date.now();
      this.showLoading();
      
      wx.cloud.callFunction({
        name: name,
        data: data,
        success: (res) => {
          this.hideLoading();
          
          // 记录请求时间
          const requestTime = Date.now() - requestStartTime;
          this.recordNetworkRequestTime(name, requestTime);
          
          if (res.result && res.result.success) {
            resolve(res.result.data);
          } else {
            const error = res.result?.error || '操作失败';
            this.handleCloudError(error);
            reject(error);
          }
        },
        fail: (error) => {
          this.hideLoading();
          
          // 记录失败的请求时间
          const requestTime = Date.now() - requestStartTime;
          this.recordNetworkRequestTime(name, requestTime, false);
          
          this.handleNetworkError(error);
          reject(error);
        }
      });
    });
  },

  // ==================== 性能监控功能 ====================

  // 初始化性能监控
  initPerformanceMonitoring() {
    if (!this.globalData.performanceConfig.enableMonitoring) {
      return;
    }

    // 监控页面性能
    this.monitorPagePerformance();
    
    // 监控网络请求性能
    this.monitorNetworkPerformance();
    
    // 监控内存使用
    this.monitorMemoryUsage();
    
    console.log('性能监控已启动');
  },

  // 监控页面性能
  monitorPagePerformance() {
    const originalPage = Page;
    const self = this;
    
    Page = function(options) {
      const originalOnLoad = options.onLoad || function() {};
      const originalOnShow = options.onShow || function() {};
      const originalOnReady = options.onReady || function() {};
      
      options.onLoad = function(query) {
        const pageLoadStart = Date.now();
        this._pageLoadStart = pageLoadStart;
        
        const result = originalOnLoad.call(this, query);
        
        return result;
      };
      
      options.onReady = function() {
        const pageLoadTime = Date.now() - (this._pageLoadStart || Date.now());
        self.recordPageLoadTime(this.route, pageLoadTime);
        
        const result = originalOnReady.call(this);
        return result;
      };
      
      options.onShow = function() {
        const pageShowStart = Date.now();
        
        const result = originalOnShow.call(this);
        
        const pageShowTime = Date.now() - pageShowStart;
        console.log(`页面 ${this.route} 显示耗时: ${pageShowTime}ms`);
        
        return result;
      };
      
      return originalPage(options);
    };
  },

  // 监控网络请求性能
  monitorNetworkPerformance() {
    const originalRequest = wx.request;
    const self = this;
    
    wx.request = function(options) {
      const requestStart = Date.now();
      const originalSuccess = options.success || function() {};
      const originalFail = options.fail || function() {};
      
      options.success = function(res) {
        const requestTime = Date.now() - requestStart;
        self.recordNetworkRequestTime(options.url, requestTime, true);
        return originalSuccess.call(this, res);
      };
      
      options.fail = function(err) {
        const requestTime = Date.now() - requestStart;
        self.recordNetworkRequestTime(options.url, requestTime, false);
        return originalFail.call(this, err);
      };
      
      return originalRequest(options);
    };
  },

  // 监控内存使用
  monitorMemoryUsage() {
    // 定期检查内存使用情况
    setInterval(() => {
      try {
        const performance = wx.getPerformance();
        if (performance && performance.memory) {
          this.globalData.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
        }
      } catch (error) {
        // 某些版本可能不支持
        console.warn('无法获取内存使用信息:', error);
      }
    }, 30000); // 每30秒检查一次
  },

  // 记录页面加载时间
  recordPageLoadTime(route, loadTime) {
    if (!this.globalData.performanceMetrics.pageLoadTimes[route]) {
      this.globalData.performanceMetrics.pageLoadTimes[route] = [];
    }
    
    this.globalData.performanceMetrics.pageLoadTimes[route].push({
      time: loadTime,
      timestamp: Date.now()
    });
    
    // 只保留最近10次记录
    if (this.globalData.performanceMetrics.pageLoadTimes[route].length > 10) {
      this.globalData.performanceMetrics.pageLoadTimes[route] = 
        this.globalData.performanceMetrics.pageLoadTimes[route].slice(-10);
    }
    
    console.log(`页面 ${route} 加载耗时: ${loadTime}ms`);
  },

  // 记录网络请求时间
  recordNetworkRequestTime(url, requestTime, success = true) {
    const key = typeof url === 'string' ? url : url.toString();
    
    if (!this.globalData.performanceMetrics.networkRequestTimes[key]) {
      this.globalData.performanceMetrics.networkRequestTimes[key] = [];
    }
    
    this.globalData.performanceMetrics.networkRequestTimes[key].push({
      time: requestTime,
      success: success,
      timestamp: Date.now()
    });
    
    // 只保留最近20次记录
    if (this.globalData.performanceMetrics.networkRequestTimes[key].length > 20) {
      this.globalData.performanceMetrics.networkRequestTimes[key] = 
        this.globalData.performanceMetrics.networkRequestTimes[key].slice(-20);
    }
    
    console.log(`网络请求 ${key} 耗时: ${requestTime}ms, 成功: ${success}`);
  },

  // 获取性能报告
  getPerformanceReport() {
    const metrics = this.globalData.performanceMetrics;
    
    // 计算平均页面加载时间
    const avgPageLoadTimes = {};
    Object.keys(metrics.pageLoadTimes).forEach(route => {
      const times = metrics.pageLoadTimes[route].map(record => record.time);
      avgPageLoadTimes[route] = times.reduce((sum, time) => sum + time, 0) / times.length;
    });
    
    // 计算平均网络请求时间
    const avgNetworkTimes = {};
    Object.keys(metrics.networkRequestTimes).forEach(url => {
      const times = metrics.networkRequestTimes[url].map(record => record.time);
      avgNetworkTimes[url] = times.reduce((sum, time) => sum + time, 0) / times.length;
    });
    
    return {
      launchTime: metrics.launchTime,
      avgPageLoadTimes: avgPageLoadTimes,
      avgNetworkTimes: avgNetworkTimes,
      memoryUsage: metrics.memoryUsage,
      cacheHitRate: metrics.cacheHitRate,
      systemInfo: this.globalData.systemInfo,
      timestamp: Date.now()
    };
  },

  // 优化建议
  getOptimizationRecommendations() {
    const report = this.getPerformanceReport();
    const recommendations = [];
    
    // 启动时间建议
    if (report.launchTime > 3000) {
      recommendations.push({
        type: 'launch',
        priority: 'high',
        message: '启动时间较长，建议减少启动时的同步操作'
      });
    }
    
    // 页面加载时间建议
    Object.keys(report.avgPageLoadTimes).forEach(route => {
      const avgTime = report.avgPageLoadTimes[route];
      if (avgTime > 2000) {
        recommendations.push({
          type: 'page',
          priority: 'medium',
          message: `页面 ${route} 加载时间较长 (${avgTime.toFixed(0)}ms)，建议优化数据加载`
        });
      }
    });
    
    // 网络请求建议
    Object.keys(report.avgNetworkTimes).forEach(url => {
      const avgTime = report.avgNetworkTimes[url];
      if (avgTime > 5000) {
        recommendations.push({
          type: 'network',
          priority: 'high',
          message: `网络请求 ${url} 响应时间较长 (${avgTime.toFixed(0)}ms)，建议优化接口性能`
        });
      }
    });
    
    // 内存使用建议
    if (report.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: '内存使用较高，建议清理缓存或优化数据结构'
      });
    }
    
    return recommendations;
  },

  // 清理性能数据
  clearPerformanceData() {
    this.globalData.performanceMetrics = {
      launchTime: 0,
      pageLoadTimes: {},
      networkRequestTimes: {},
      memoryUsage: 0,
      cacheHitRate: 0
    };
    
    console.log('性能数据已清理');
  }
});