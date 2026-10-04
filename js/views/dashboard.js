/**
 * 仪表盘（工作台）
 */
const DashboardView = {
  template: `
    <div>
      <div class="page-card">
        <div class="page-title">工作台 · 今日概览</div>

        <!-- 统计卡片 -->
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-icon blue"><el-icon :size="28"><UserFilled /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.patients }}</div>
              <div class="stat-label">在册患者</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green"><el-icon :size="28"><User /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.doctors }}</div>
              <div class="stat-label">在职医生</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange"><el-icon :size="28"><Calendar /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayAppts }}</div>
              <div class="stat-label">今日挂号</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red"><el-icon :size="28"><Tickets /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingAppts }}</div>
              <div class="stat-label">待就诊</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple"><el-icon :size="28"><FirstAidKit /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.lowStock }}</div>
              <div class="stat-label">库存预警</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon cyan"><el-icon :size="28"><Money /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.todayRevenue.toLocaleString() }}</div>
              <div class="stat-label">今日收入</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区 -->
      <div class="chart-row">
        <div class="page-card">
          <div class="page-title">近7日挂号趋势</div>
          <div ref="trendChart" class="chart-box"></div>
        </div>
        <div class="page-card">
          <div class="page-title">科室挂号分布</div>
          <div ref="deptChart" class="chart-box"></div>
        </div>
      </div>

      <!-- 待办与最近就诊 -->
      <div class="chart-row">
        <div class="page-card">
          <div class="page-title">今日挂号列表</div>
          <el-table :data="todayAppts" stripe size="default" empty-text="今日暂无挂号">
            <el-table-column prop="id" label="编号" width="70" />
            <el-table-column label="患者" width="100">
              <template #default="{ row }">{{ getPatient(row.patientId)?.name }}</template>
            </el-table-column>
            <el-table-column label="科室" width="100">
              <template #default="{ row }">{{ getDept(row.departmentId)?.name }}</template>
            </el-table-column>
            <el-table-column label="医生" width="110">
              <template #default="{ row }">{{ getDoctor(row.doctorId)?.name }}</template>
            </el-table-column>
            <el-table-column prop="time" label="时间" width="80" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="page-card">
          <div class="page-title">药品库存 TOP5（低库存）</div>
          <el-table :data="lowStockMeds" stripe size="default">
            <el-table-column prop="name" label="药品" />
            <el-table-column prop="stock" label="库存" width="80">
              <template #default="{ row }">
                <span style="color:#f5222d;font-weight:bold;">{{ row.stock }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置" width="100" />
          </el-table>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      trendChart: null,
      deptChart: null,
      stats: {
        patients: 0, doctors: 0, todayAppts: 0, pendingAppts: 0,
        lowStock: 0, todayRevenue: 0
      }
    };
  },
  computed: {
    departments() { return DB.list(DB.KEYS.DEPARTMENTS); },
    todayAppts() {
      const today = new Date().toISOString().slice(0, 10);
      return DB.list(DB.KEYS.APPOINTMENTS).filter(a => a.date === today);
    },
    lowStockMeds() {
      return DB.list(DB.KEYS.MEDICINES).filter(m => m.stock < 100).sort((a,b) => a.stock - b.stock).slice(0, 5);
    }
  },
  mounted() {
    this.computeStats();
    this.$nextTick(() => {
      this.renderCharts();
      window.addEventListener('resize', this.resizeCharts);
    });
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeCharts);
    this.trendChart?.dispose();
    this.deptChart?.dispose();
  },
  methods: {
    getPatient(id) { return DB.getById(DB.KEYS.PATIENTS, id); },
    getDept(id) { return DB.getById(DB.KEYS.DEPARTMENTS, id); },
    getDoctor(id) { return DB.getById(DB.KEYS.DOCTORS, id); },
    statusTag(s) {
      return { '已完成': 'success', '待就诊': 'warning', '进行中': 'primary', '已预约': 'info', '已取消': 'danger' }[s] || 'info';
    },
    computeStats() {
      const today = new Date().toISOString().slice(0, 10);
      const appts = DB.list(DB.KEYS.APPOINTMENTS);
      const bills = DB.list(DB.KEYS.BILLS);
      const meds = DB.list(DB.KEYS.MEDICINES);

      this.stats.patients = DB.list(DB.KEYS.PATIENTS).length;
      this.stats.doctors = DB.list(DB.KEYS.DOCTORS).length;
      this.stats.todayAppts = appts.filter(a => a.date === today).length;
      this.stats.pendingAppts = appts.filter(a => ['待就诊', '进行中'].includes(a.status)).length;
      this.stats.lowStock = meds.filter(m => m.stock < 100).length;
      this.stats.todayRevenue = bills.filter(b => b.status === '已结清').reduce((s, b) => s + b.paid, 0);
    },
    resizeCharts() {
      this.trendChart?.resize();
      this.deptChart?.resize();
    },
    renderCharts() {
      // 近7天挂号数据（模拟 + 真实）
      const days = [];
      const counts = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        days.push(`${d.getMonth()+1}/${d.getDate()}`);
        counts.push(DB.list(DB.KEYS.APPOINTMENTS).filter(a => a.date === ds).length + Math.floor(Math.random() * 4) + 2);
      }
      this.trendChart = echarts.init(this.$refs.trendChart);
      this.trendChart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: 30, left: 40, right: 20, bottom: 30 },
        xAxis: { type: 'category', data: days },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          name: '挂号数', type: 'line', smooth: true,
          data: counts,
          itemStyle: { color: '#1890ff' },
          areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[
            { offset: 0, color: 'rgba(24,144,255,0.4)' },
            { offset: 1, color: 'rgba(24,144,255,0.05)' }
          ])}
        }]
      });

      // 科室分布
      const depts = this.departments;
      const appts = DB.list(DB.KEYS.APPOINTMENTS);
      const deptData = depts.map(d => ({
        name: d.name,
        value: appts.filter(a => a.departmentId === d.id).length + Math.floor(Math.random() * 5)
      }));
      this.deptChart = echarts.init(this.$refs.deptChart);
      this.deptChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, type: 'scroll' },
        series: [{
          type: 'pie', radius: ['40%', '65%'], center: ['50%', '42%'],
          data: deptData,
          label: { show: true, formatter: '{b}\n{d}%' }
        }]
      });
    }
  }
};

window.DashboardView = DashboardView;
