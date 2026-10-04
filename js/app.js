/**
 * 主应用入口 - 包含全局布局（侧边栏 + 顶部栏 + 路由视图）
 */
const App = {
  template: `
    <div class="main-layout">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <el-icon class="logo-icon"><FirstAidKit /></el-icon>
          <span>智慧HIS</span>
        </div>
        <el-menu
          class="sidebar-menu"
          :default-active="route.path"
          background-color="#001529"
          text-color="rgba(255,255,255,0.75)"
          active-text-color="#ffffff"
          router
          unique-opened
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>工作台</span>
          </el-menu-item>

          <el-sub-menu index="hospital">
            <template #title>
              <el-icon><OfficeBuilding /></el-icon>
              <span>医院管理</span>
            </template>
            <el-menu-item index="/departments">科室管理</el-menu-item>
            <el-menu-item index="/doctors">医生管理</el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/patients">
            <el-icon><UserFilled /></el-icon>
            <span>患者管理</span>
          </el-menu-item>

          <el-menu-item index="/appointments">
            <el-icon><Calendar /></el-icon>
            <span>挂号管理</span>
          </el-menu-item>

          <el-menu-item index="/emr">
            <el-icon><Document /></el-icon>
            <span>电子病历</span>
          </el-menu-item>

          <el-menu-item index="/prescriptions">
            <el-icon><Tickets /></el-icon>
            <span>处方管理</span>
          </el-menu-item>

          <el-menu-item index="/pharmacy">
            <el-icon><FirstAidKit /></el-icon>
            <span>药品管理</span>
          </el-menu-item>

          <el-menu-item index="/billing">
            <el-icon><Money /></el-icon>
            <span>收费管理</span>
          </el-menu-item>

          <el-menu-item index="/lab">
            <el-icon><DataAnalysis /></el-icon>
            <span>检验报告</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 右侧内容区 -->
      <div class="main-content">
        <div class="top-bar">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="user-info">
            <el-tag type="success" effect="light">管理员</el-tag>
            <el-dropdown trigger="click">
              <span style="cursor:pointer;display:flex;align-items:center;gap:6px;">
                <el-avatar :size="32" style="background:#1890ff;">A</el-avatar>
                <span class="user-name">admin</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="resetData">
                    <el-icon><Refresh /></el-icon> 重置演示数据
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="page-container">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </div>
  `,
  computed: {
    route() { return this.$route; },
    currentTitle() {
      const matched = this.$route.matched;
      return matched.length > 0 ? (this.$route.meta.title || '首页') : '首页';
    }
  },
  methods: {
    resetData() {
      this.$confirm('确定要重置所有演示数据吗？这将恢复到初始 Mock 数据。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        DB.reset();
        this.$message.success('数据已重置，页面将刷新');
        setTimeout(() => location.reload(), 800);
      }).catch(() => {});
    }
  }
};

// 创建 Vue 应用
const app = Vue.createApp(App);
app.use(ElementPlus);
app.use(router);

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 全局组件和指令挂载
app.config.globalProperties.$db = DB;

app.mount('#app');
