/**
 * 挂号管理
 */
const AppointmentsView = {
  template: `
    <div>
      <div class="page-card">
        <div class="page-title">挂号管理</div>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="keyword" placeholder="患者/医生" clearable style="width:200px;">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-select v-model="filterDept" placeholder="全部科室" clearable style="width:160px;">
              <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width:140px;">
              <el-option v-for="s in statusList" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增挂号</el-button>
          </div>
        </div>

        <el-table :data="filteredList" stripe border>
          <el-table-column prop="id" label="编号" width="70" />
          <el-table-column label="患者" width="120">
            <template #default="{ row }">{{ getPatient(row.patientId)?.name }}</template>
          </el-table-column>
          <el-table-column label="科室" width="110">
            <template #default="{ row }">{{ getDept(row.departmentId)?.name }}</template>
          </el-table-column>
          <el-table-column label="医生" width="120">
            <template #default="{ row }">{{ getDoctor(row.doctorId)?.name }}</template>
          </el-table-column>
          <el-table-column prop="date" label="日期" width="110" />
          <el-table-column prop="time" label="时间" width="80" />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === '急诊' ? 'danger' : 'primary'" size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fee" label="挂号费" width="90">
            <template #default="{ row }">¥{{ row.fee }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" min-width="140" show-overflow-tooltip />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="success" link @click="complete(row)" v-if="['待就诊','进行中'].includes(row.status)">完成</el-button>
              <el-button size="small" type="warning" link @click="start(row)" v-if="row.status === '已预约'">接诊</el-button>
              <el-button size="small" type="danger" link @click="cancel(row)" v-if="['已预约','待就诊'].includes(row.status)">取消</el-button>
              <el-button size="small" type="info" link @click="print(row)" v-if="row.status === '已完成'">打印</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 新增挂号 -->
      <el-dialog v-model="dialogVisible" title="新增挂号" width="560px" class="form-dialog">
        <el-form :model="form" label-width="90px">
          <el-form-item label="患者">
            <el-select v-model="form.patientId" filterable placeholder="选择或搜索患者" style="width:100%;">
              <el-option v-for="p in patients" :key="p.id" :label="p.name + ' (' + p.phone + ')'" :value="p.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="科室">
            <el-select v-model="form.departmentId" placeholder="选择科室" style="width:100%;" @change="onDeptChange">
              <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="医生">
            <el-select v-model="form.doctorId" placeholder="选择医生" style="width:100%;" :disabled="!form.departmentId">
              <el-option v-for="doc in availableDoctors" :key="doc.id" :label="doc.name + ' - ' + doc.title" :value="doc.id" />
            </el-select>
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="日期">
                <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width:100%;" :disabled-date="disabledDate" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="时间">
                <el-time-picker v-model="form.time" format="HH:mm" value-format="HH:mm" style="width:100%;" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="类型">
                <el-select v-model="form.type" style="width:100%;">
                  <el-option label="门诊" value="门诊" />
                  <el-option label="急诊" value="急诊" />
                  <el-option label="复诊" value="复诊" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="挂号费">
                <el-input-number v-model="form.fee" :min="0" :step="10" style="width:100%;" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注"><el-input v-model="form.notes" type="textarea" :rows="2" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </template>
      </el-dialog>
    </div>
  `,
  data() {
    return {
      keyword: '', filterDept: null, filterStatus: null,
      dialogVisible: false,
      form: { patientId: null, departmentId: null, doctorId: null, date: '', time: '09:00', type: '门诊', fee: 50, notes: '' },
      statusList: ['已预约', '待就诊', '进行中', '已完成', '已取消'],
      refreshKey: 0
    };
  },
  computed: {
    departments() { this.refreshKey; return DB.list(DB.KEYS.DEPARTMENTS); },
    doctors() { this.refreshKey; return DB.list(DB.KEYS.DOCTORS); },
    patients() { this.refreshKey; return DB.list(DB.KEYS.PATIENTS); },
    list() { this.refreshKey; return DB.list(DB.KEYS.APPOINTMENTS).sort((a,b) => (b.date+a.time).localeCompare(a.date+a.time)); },
    filteredList() {
      return this.list.filter(a => {
        if (this.filterDept && a.departmentId !== this.filterDept) return false;
        if (this.filterStatus && a.status !== this.filterStatus) return false;
        if (!this.keyword) return true;
        const kw = this.keyword.toLowerCase();
        const p = this.getPatient(a.patientId);
        const d = this.getDoctor(a.doctorId);
        return (p?.name || '').toLowerCase().includes(kw) || (d?.name || '').toLowerCase().includes(kw);
      });
    },
    availableDoctors() {
      return this.doctors.filter(d => !this.form.departmentId || d.departmentId === this.form.departmentId);
    }
  },
  methods: {
    getPatient(id) { return DB.getById(DB.KEYS.PATIENTS, id); },
    getDept(id) { return DB.getById(DB.KEYS.DEPARTMENTS, id); },
    getDoctor(id) { return DB.getById(DB.KEYS.DOCTORS, id); },
    statusTag(s) {
      return { '已完成': 'success', '待就诊': 'warning', '进行中': 'primary', '已预约': 'info', '已取消': 'danger' }[s] || 'info';
    },
    disabledDate(d) { return d < new Date(new Date().toDateString()); },
    onDeptChange() { this.form.doctorId = null; },
    openAdd() {
      this.form = { patientId: null, departmentId: null, doctorId: null, date: new Date().toISOString().slice(0,10), time: '09:00', type: '门诊', fee: 50, notes: '' };
      this.dialogVisible = true;
    },
    save() {
      if (!this.form.patientId || !this.form.doctorId || !this.form.date) {
        this.$message.warning('请完整填写挂号信息'); return;
      }
      DB.create(DB.KEYS.APPOINTMENTS, { ...this.form, status: '已预约' });
      this.$message.success('挂号成功');
      this.dialogVisible = false;
      this.refreshKey++;
    },
    start(row) { DB.update(DB.KEYS.APPOINTMENTS, row.id, { status: '进行中' }); this.$message.success('已接诊'); this.refreshKey++; },
    complete(row) { DB.update(DB.KEYS.APPOINTMENTS, row.id, { status: '已完成' }); this.$message.success('已完成'); this.refreshKey++; },
    cancel(row) {
      this.$confirm('确定取消该挂号？', '提示', { type: 'warning' }).then(() => {
        DB.update(DB.KEYS.APPOINTMENTS, row.id, { status: '已取消' });
        this.$message.success('已取消');
        this.refreshKey++;
      }).catch(() => {});
    },
    print(row) {
      const p = this.getPatient(row.patientId), d = this.getDoctor(row.doctorId), dept = this.getDept(row.departmentId);
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>挂号单</title><style>
        body{font-family:sans-serif;padding:30px;}h2{text-align:center;color:#1890ff;}
        table{width:100%;border-collapse:collapse;margin-top:20px;}td{padding:10px;border:1px solid #ddd;}
        .label{background:#fafafa;width:120px;color:#606266;}
      </style></head><body>
        <h2>智慧医院挂号单</h2>
        <table>
          <tr><td class="label">挂号编号</td><td>${row.id}</td><td class="label">类型</td><td>${row.type}</td></tr>
          <tr><td class="label">患者姓名</td><td>${p?.name}</td><td class="label">性别</td><td>${p?.gender}</td></tr>
          <tr><td class="label">科室</td><td>${dept?.name}</td><td class="label">医生</td><td>${d?.name}（${d?.title}）</td></tr>
          <tr><td class="label">日期时间</td><td>${row.date} ${row.time}</td><td class="label">挂号费</td><td>¥${row.fee}</td></tr>
          <tr><td class="label">备注</td><td colspan="3">${row.notes || '-'}</td></tr>
        </table>
        <p style="text-align:center;margin-top:40px;color:#909399;">打印时间：${new Date().toLocaleString()}</p>
      </body></html>`);
      w.document.close(); setTimeout(() => w.print(), 300);
    }
  }
};

window.AppointmentsView = AppointmentsView;
