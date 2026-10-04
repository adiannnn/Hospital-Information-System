/**
 * 收费管理
 */
const BillingView = {
  template: `
    <div>
      <div class="page-card">
        <div class="page-title">收费管理</div>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="keyword" placeholder="患者/账单号" clearable style="width:240px;">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width:140px;">
              <el-option v-for="s in ['待缴费','已结清','已退款']" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增收费单</el-button>
          </div>
        </div>

        <el-table :data="filteredList" stripe border>
          <el-table-column prop="id" label="账单号" width="90" />
          <el-table-column label="患者" width="120">
            <template #default="{ row }">{{ getPatient(row.patientId)?.name }}</template>
          </el-table-column>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column label="收费项" min-width="180">
            <template #default="{ row }">
              <el-tag v-for="(it, i) in row.items?.slice(0,3)" :key="i" size="small" style="margin-right:4px;">{{ it.name }}</el-tag>
              <span v-if="row.items?.length > 3">等{{ row.items.length }}项</span>
            </template>
          </el-table-column>
          <el-table-column label="总金额" width="110">
            <template #default="{ row }"><b style="color:#f5222d;">¥{{ row.total?.toFixed(2) }}</b></template>
          </el-table-column>
          <el-table-column label="已收" width="110">
            <template #default="{ row }">¥{{ row.paid?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="billingTag(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="viewBill(row)">查看</el-button>
              <el-button size="small" type="success" link @click="payBill(row)" v-if="row.status === '待缴费'">收费</el-button>
              <el-button size="small" type="danger" link @click="refund(row)" v-if="row.status === '已结清'">退款</el-button>
              <el-button size="small" type="info" link @click="printBill(row)">打印</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 统计汇总 -->
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-icon cyan"><el-icon :size="28"><Tickets /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.billCount }}</div>
            <div class="stat-label">账单总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><el-icon :size="28"><Clock /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingCount }}</div>
            <div class="stat-label">待缴费</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><el-icon :size="28"><Money /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">¥{{ stats.totalRevenue.toLocaleString() }}</div>
            <div class="stat-label">累计收入</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><el-icon :size="28"><Money /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">¥{{ stats.monthRevenue.toLocaleString() }}</div>
            <div class="stat-label">本月收入</div>
          </div>
        </div>
      </div>

      <!-- 新增收费单 -->
      <el-dialog v-model="dialogVisible" title="新增收费单" width="700px" top="5vh" class="form-dialog">
        <el-form :model="form" label-width="100px">
          <el-form-item label="患者">
            <el-select v-model="form.patientId" filterable placeholder="选择患者" style="width:100%;">
              <el-option v-for="p in patients" :key="p.id" :label="p.name + ' - ' + p.phone" :value="p.id" />
            </el-select>
          </el-form-item>
        </el-form>
        <div style="border:1px dashed #dcdfe6;padding:12px;border-radius:4px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <b>收费项目</b>
            <el-button size="small" type="primary" link @click="addBillItem">+ 添加项目</el-button>
          </div>
          <el-table :data="form.items" border size="small" empty-text="请添加收费项目">
            <el-table-column label="类型" width="120">
              <template #default="{ row }">
                <el-select v-model="row.type" style="width:100%;" size="small">
                  <el-option v-for="t in ['挂号费','药品费','化验费','检查费','治疗费','手术费','其他']" :key="t" :label="t" :value="t" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="项目名称" min-width="200">
              <template #default="{ row }"><el-input v-model="row.name" size="small" /></template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="{ row }"><el-input-number v-model="row.amount" :min="0" :precision="2" size="small" style="width:100%;" @change="calcTotal" /></template>
            </el-table-column>
            <el-table-column label="操作" width="70">
              <template #default="{ $index }"><el-button size="small" type="danger" link @click="removeBillItem($index)">删除</el-button></template>
            </el-table-column>
          </el-table>
          <div style="text-align:right;margin-top:10px;font-size:16px;">
            合计：<b style="color:#f5222d;">¥{{ form.total?.toFixed(2) }}</b>
          </div>
        </div>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBill">保存</el-button>
        </template>
      </el-dialog>

      <!-- 查看 -->
      <el-dialog v-model="viewVisible" title="收费单详情" width="500px">
        <div v-if="currentBill">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="账单号">{{ currentBill.id }}</el-descriptions-item>
            <el-descriptions-item label="日期">{{ currentBill.date }}</el-descriptions-item>
            <el-descriptions-item label="患者">{{ getPatient(currentBill.patientId)?.name }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ currentBill.status }}</el-descriptions-item>
          </el-descriptions>
          <h4 style="margin:16px 0 8px;">收费明细</h4>
          <el-table :data="currentBill.items" border size="small">
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="name" label="项目" />
            <el-table-column label="金额" width="110">
              <template #default="{ row }">¥{{ row.amount?.toFixed(2) }}</template>
            </el-table-column>
          </el-table>
          <div style="text-align:right;margin-top:12px;font-size:16px;">
            合计：<b style="color:#f5222d;">¥{{ currentBill.total?.toFixed(2) }}</b>
          </div>
        </div>
      </el-dialog>

      <!-- 支付对话框 -->
      <el-dialog v-model="payVisible" title="收费确认" width="400px" class="form-dialog">
        <el-form label-width="100px">
          <el-form-item label="应收金额"><b style="color:#f5222d;font-size:20px;">¥{{ currentBill?.total?.toFixed(2) }}</b></el-form-item>
          <el-form-item label="支付方式">
            <el-radio-group v-model="payMethod">
              <el-radio value="现金">现金</el-radio>
              <el-radio value="微信支付">微信</el-radio>
              <el-radio value="支付宝">支付宝</el-radio>
              <el-radio value="银行卡">银行卡</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="payVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmPay">确认收费</el-button>
        </template>
      </el-dialog>
    </div>
  `,
  data() {
    return {
      keyword: '', filterStatus: null, dialogVisible: false, viewVisible: false, payVisible: false,
      currentBill: null, payMethod: '微信支付',
      form: { patientId: null, items: [], total: 0 },
      stats: { billCount: 0, pendingCount: 0, totalRevenue: 0, monthRevenue: 0 },
      refreshKey: 0
    };
  },
  computed: {
    patients() { this.refreshKey; return DB.list(DB.KEYS.PATIENTS); },
    list() { this.refreshKey; return DB.list(DB.KEYS.BILLS).sort((a,b) => b.date.localeCompare(a.date)); },
    filteredList() {
      return this.list.filter(b => {
        if (this.filterStatus && b.status !== this.filterStatus) return false;
        if (!this.keyword) return true;
        const kw = this.keyword.toLowerCase();
        return String(b.id).includes(kw) || (this.getPatient(b.patientId)?.name || '').toLowerCase().includes(kw);
      });
    }
  },
  mounted() { this.computeStats(); },
  methods: {
    getPatient(id) { return DB.getById(DB.KEYS.PATIENTS, id); },
    billingTag(s) { return { '待缴费': 'warning', '已结清': 'success', '已退款': 'danger' }[s] || 'info'; },
    computeStats() {
      const bills = DB.list(DB.KEYS.BILLS);
      const now = new Date(); const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      this.stats.billCount = bills.length;
      this.stats.pendingCount = bills.filter(b => b.status === '待缴费').length;
      this.stats.totalRevenue = bills.filter(b => b.status === '已结清').reduce((s,b) => s + (b.total||0), 0);
      this.stats.monthRevenue = bills.filter(b => b.status === '已结清' && b.date.startsWith(ym)).reduce((s,b) => s + (b.total||0), 0);
    },
    openAdd() { this.form = { patientId: null, items: [], total: 0 }; this.dialogVisible = true; },
    addBillItem() { this.form.items.push({ type: '挂号费', name: '', amount: 0 }); },
    removeBillItem(idx) { this.form.items.splice(idx, 1); this.calcTotal(); },
    calcTotal() { this.form.total = this.form.items.reduce((s,i) => s + (i.amount||0), 0); },
    saveBill() {
      if (!this.form.patientId) { this.$message.warning('请选择患者'); return; }
      if (this.form.items.length === 0) { this.$message.warning('请至少添加一个收费项目'); return; }
      DB.create(DB.KEYS.BILLS, {
        patientId: this.form.patientId,
        date: new Date().toISOString().slice(0,10),
        items: this.form.items,
        total: this.form.total,
        paid: 0,
        paymentMethod: '',
        status: '待缴费'
      });
      this.$message.success('收费单已创建');
      this.dialogVisible = false; this.computeStats();
      this.refreshKey++;
    },
    viewBill(row) { this.currentBill = row; this.viewVisible = true; },
    payBill(row) { this.currentBill = row; this.payMethod = '微信支付'; this.payVisible = true; },
    confirmPay() {
      DB.update(DB.KEYS.BILLS, this.currentBill.id, { status: '已结清', paid: this.currentBill.total, paymentMethod: this.payMethod });
      this.$message.success('收费成功');
      this.payVisible = false; this.computeStats();
      this.refreshKey++;
    },
    refund(row) {
      this.$confirm(`确定退款 ¥${row.total}？`, '退款确认', { type: 'warning' }).then(() => {
        DB.update(DB.KEYS.BILLS, row.id, { status: '已退款' });
        this.$message.success('已退款'); this.computeStats();
        this.refreshKey++;
      }).catch(() => {});
    },
    printBill(row) {
      const p = this.getPatient(row.patientId);
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>收费收据</title><style>
        body{font-family:sans-serif;padding:30px;max-width:500px;margin:auto;}
        h2{text-align:center;color:#1890ff;}table{width:100%;border-collapse:collapse;margin-top:15px;}
        td,th{padding:8px;border:1px solid #ddd;}
      </style></head><body>
        <h2>智慧医院收费收据</h2>
        <p>账单号：${row.id} | 日期：${row.date}</p>
        <p>患者：${p?.name} | ${p?.phone}</p>
        <table>
          <tr><th>类型</th><th>项目</th><th>金额</th></tr>
          ${row.items.map(i => `<tr><td>${i.type}</td><td>${i.name}</td><td>¥${i.amount?.toFixed(2)}</td></tr>`).join('')}
          <tr><td colspan="2" style="text-align:right;font-weight:bold;">合计</td><td><b style="color:#f5222d;">¥${row.total?.toFixed(2)}</b></td></tr>
          <tr><td colspan="2" style="text-align:right;">支付方式</td><td>${row.paymentMethod || '-'}</td></tr>
          <tr><td colspan="2" style="text-align:right;">状态</td><td>${row.status}</td></tr>
        </table>
        <p style="text-align:center;margin-top:40px;color:#909399;">打印时间：${new Date().toLocaleString()}</p>
      </body></html>`);
      w.document.close(); setTimeout(() => w.print(), 300);
    }
  }
};

window.BillingView = BillingView;
