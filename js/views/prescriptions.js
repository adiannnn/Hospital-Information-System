/**
 * 处方管理
 */
const PrescriptionsView = {
  template: `
    <div>
      <div class="page-card">
        <div class="page-title">处方管理</div>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="keyword" placeholder="患者/医生" clearable style="width:220px;">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width:140px;">
              <el-option v-for="s in ['待缴费','已缴费','已发药','已取消']" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div>
            <el-button type="primary" :icon="Plus" @click="openNew">开处方</el-button>
          </div>
        </div>

        <el-table :data="filteredList" stripe border>
          <el-table-column prop="id" label="编号" width="70" />
          <el-table-column label="患者" width="120">
            <template #default="{ row }">{{ getPatient(row.patientId)?.name }}</template>
          </el-table-column>
          <el-table-column label="开方医生" width="120">
            <template #default="{ row }">{{ getDoctor(row.doctorId)?.name }}</template>
          </el-table-column>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column label="药品数" width="90">
            <template #default="{ row }">{{ row.items?.length || 0 }}</template>
          </el-table-column>
          <el-table-column label="总金额" width="110">
            <template #default="{ row }"><b style="color:#f5222d;">¥{{ row.total?.toFixed(2) }}</b></template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="prescTag(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="viewPresc(row)">查看</el-button>
              <el-button size="small" type="success" link @click="pay(row)" v-if="row.status === '待缴费'">缴费</el-button>
              <el-button size="small" type="warning" link @click="dispense(row)" v-if="row.status === '已缴费'">发药</el-button>
              <el-button size="small" type="info" link @click="printPresc(row)">打印</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 开处方对话框 -->
      <el-dialog v-model="dialogVisible" title="开处方" width="780px" top="5vh" class="form-dialog">
        <el-form :model="form" label-width="100px">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="患者">
                <el-select v-model="form.patientId" filterable placeholder="选择患者" style="width:100%;">
                  <el-option v-for="p in patients" :key="p.id" :label="p.name + ' - ' + p.phone" :value="p.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="医生">
                <el-select v-model="form.doctorId" placeholder="选择医生" style="width:100%;">
                  <el-option v-for="d in doctors" :key="d.id" :label="d.name + ' - ' + d.title" :value="d.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div style="border:1px dashed #dcdfe6;padding:12px;border-radius:4px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <b>药品清单</b>
            <el-button size="small" type="primary" link @click="addItem">+ 添加药品</el-button>
          </div>
          <el-table :data="form.items" border size="small" empty-text="请添加药品">
            <el-table-column label="药品" min-width="180">
              <template #default="{ row }">
                <el-select v-model="row.medicineId" filterable placeholder="选择药品" style="width:100%;" @change="(val) => onMedChange(row, val)">
                  <el-option v-for="m in medicines" :key="m.id" :label="m.name + ' (' + m.spec + ') 库存:' + m.stock" :value="m.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="110">
              <template #default="{ row }">
                <el-input-number v-model="row.qty" :min="1" size="small" style="width:100%;" @change="calcTotal" />
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价" width="90">
              <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="小计" width="100">
              <template #default="{ row }">¥{{ (row.unitPrice * row.qty)?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="70">
              <template #default="{ $index }">
                <el-button size="small" type="danger" link @click="removeItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="text-align:right;margin-top:10px;font-size:16px;">
            合计：<b style="color:#f5222d;">¥{{ form.total?.toFixed(2) }}</b>
          </div>
        </div>

        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePresc">保存处方</el-button>
        </template>
      </el-dialog>

      <!-- 查看处方 -->
      <el-dialog v-model="viewVisible" title="处方详情" width="600px">
        <div v-if="currentPresc">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="处方编号">{{ currentPresc.id }}</el-descriptions-item>
            <el-descriptions-item label="开方日期">{{ currentPresc.date }}</el-descriptions-item>
            <el-descriptions-item label="患者">{{ getPatient(currentPresc.patientId)?.name }}</el-descriptions-item>
            <el-descriptions-item label="开方医生">{{ getDoctor(currentPresc.doctorId)?.name }}</el-descriptions-item>
          </el-descriptions>
          <h4 style="margin:16px 0 8px;">药品明细</h4>
          <el-table :data="currentPresc.items" border size="small">
            <el-table-column prop="name" label="药品" />
            <el-table-column prop="spec" label="规格" width="140" />
            <el-table-column prop="qty" label="数量" width="70" />
            <el-table-column label="小计" width="100">
              <template #default="{ row }">¥{{ row.total?.toFixed(2) }}</template>
            </el-table-column>
          </el-table>
          <div style="text-align:right;margin-top:12px;font-size:16px;">
            合计：<b style="color:#f5222d;">¥{{ currentPresc.total?.toFixed(2) }}</b>
          </div>
        </div>
      </el-dialog>
    </div>
  `,
  data() {
    return {
      keyword: '', filterStatus: null, dialogVisible: false, viewVisible: false,
      currentPresc: null,
      form: { patientId: null, doctorId: null, items: [], total: 0 },
      refreshKey: 0
    };
  },
  computed: {
    patients() { this.refreshKey; return DB.list(DB.KEYS.PATIENTS); },
    doctors() { this.refreshKey; return DB.list(DB.KEYS.DOCTORS); },
    medicines() { this.refreshKey; return DB.list(DB.KEYS.MEDICINES); },
    list() { this.refreshKey; return DB.list(DB.KEYS.PRESCRIPTIONS).sort((a,b) => b.date.localeCompare(a.date)); },
    filteredList() {
      return this.list.filter(p => {
        if (this.filterStatus && p.status !== this.filterStatus) return false;
        if (!this.keyword) return true;
        const kw = this.keyword.toLowerCase();
        return (this.getPatient(p.patientId)?.name || '').toLowerCase().includes(kw) ||
               (this.getDoctor(p.doctorId)?.name || '').toLowerCase().includes(kw);
      });
    }
  },
  methods: {
    getPatient(id) { return DB.getById(DB.KEYS.PATIENTS, id); },
    getDoctor(id) { return DB.getById(DB.KEYS.DOCTORS, id); },
    getMed(id) { return DB.getById(DB.KEYS.MEDICINES, id); },
    prescTag(s) {
      return { '待缴费': 'warning', '已缴费': 'success', '已发药': 'primary', '已取消': 'info' }[s] || 'info';
    },
    openNew() {
      this.form = { patientId: null, doctorId: null, items: [], total: 0 };
      this.dialogVisible = true;
    },
    addItem() { this.form.items.push({ medicineId: null, name: '', spec: '', qty: 1, unitPrice: 0, total: 0 }); },
    removeItem(idx) { this.form.items.splice(idx, 1); this.calcTotal(); },
    onMedChange(row, id) {
      const m = this.getMed(id);
      if (m) { row.name = m.name; row.spec = m.spec; row.unitPrice = m.price; row.total = m.price * row.qty; this.calcTotal(); }
    },
    calcTotal() {
      this.form.items.forEach(i => i.total = (i.unitPrice || 0) * (i.qty || 0));
      this.form.total = this.form.items.reduce((s, i) => s + (i.total || 0), 0);
    },
    savePresc() {
      if (!this.form.patientId || !this.form.doctorId) { this.$message.warning('请选择患者和医生'); return; }
      if (this.form.items.length === 0) { this.$message.warning('请至少添加一种药品'); return; }
      DB.create(DB.KEYS.PRESCRIPTIONS, {
        patientId: this.form.patientId,
        doctorId: this.form.doctorId,
        date: new Date().toISOString().slice(0,10),
        items: this.form.items,
        total: this.form.total,
        status: '待缴费'
      });
      this.$message.success('处方已开具');
      this.dialogVisible = false;
      this.refreshKey++;
    },
    viewPresc(row) { this.currentPresc = row; this.viewVisible = true; },
    pay(row) { DB.update(DB.KEYS.PRESCRIPTIONS, row.id, { status: '已缴费' }); this.$message.success('已缴费'); this.refreshKey++; },
    dispense(row) {
      // 扣减库存
      row.items.forEach(item => {
        const med = this.getMed(item.medicineId);
        if (med) DB.update(DB.KEYS.MEDICINES, med.id, { stock: Math.max(0, med.stock - item.qty) });
      });
      DB.update(DB.KEYS.PRESCRIPTIONS, row.id, { status: '已发药' });
      this.$message.success('已发药，库存已扣减');
      this.refreshKey++;
    },
    printPresc(row) {
      const p = this.getPatient(row.patientId), d = this.getDoctor(row.doctorId);
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>处方单</title><style>
        body{font-family:sans-serif;padding:30px;max-width:700px;margin:auto;}h2{text-align:center;color:#1890ff;}
        table{width:100%;border-collapse:collapse;margin-top:15px;}td,th{padding:8px;border:1px solid #ddd;text-align:left;}
        .info{display:flex;justify-content:space-between;background:#fafafa;padding:12px;border-radius:4px;margin-top:15px;}
      </style></head><body>
        <h2>智慧医院处方单</h2>
        <div class="info">
          <span>处方号：${row.id}</span><span>日期：${row.date}</span>
        </div>
        <div class="info"><span>患者：${p?.name} | ${p?.gender}</span><span>开方医生：${d?.name} ${d?.title}</span></div>
        <table>
          <tr><th>药品</th><th>规格</th><th>数量</th><th>单价</th><th>小计</th></tr>
          ${row.items.map(i => `<tr><td>${i.name}</td><td>${i.spec}</td><td>${i.qty}</td><td>¥${i.unitPrice?.toFixed(2)}</td><td>¥${i.total?.toFixed(2)}</td></tr>`).join('')}
          <tr><td colspan="4" style="text-align:right;font-weight:bold;">合计</td><td><b style="color:#f5222d;">¥${row.total?.toFixed(2)}</b></td></tr>
        </table>
        <p style="text-align:center;margin-top:40px;color:#909399;">状态：${row.status} | 打印时间：${new Date().toLocaleString()}</p>
      </body></html>`);
      w.document.close(); setTimeout(() => w.print(), 300);
    }
  }
};

window.PrescriptionsView = PrescriptionsView;
