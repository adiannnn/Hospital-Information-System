/**
 * 检验报告
 */
const LabView = {
  template: `
    <div>
      <div class="page-card">
        <div class="page-title">检验报告</div>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="keyword" placeholder="患者/检验项目" clearable style="width:260px;">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width:140px;">
              <el-option v-for="s in ['检验中','已出报告']" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增检验</el-button>
          </div>
        </div>

        <el-table :data="filteredList" stripe border>
          <el-table-column prop="id" label="编号" width="70" />
          <el-table-column label="患者" width="120">
            <template #default="{ row }">{{ getPatient(row.patientId)?.name }}</template>
          </el-table-column>
          <el-table-column prop="testName" label="检验项目" width="140" />
          <el-table-column prop="testDate" label="采样日期" width="120" />
          <el-table-column prop="resultDate" label="报告日期" width="120" />
          <el-table-column prop="orderedBy" label="开单医生" width="120" />
          <el-table-column label="异常项" width="90">
            <template #default="{ row }">
              <span v-if="abnormalCount(row.items) > 0" style="color:#f5222d;font-weight:bold;">
                {{ abnormalCount(row.items) }} 项
              </span>
              <span v-else style="color:#52c41a;">正常</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '已出报告' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="viewReport(row)">查看报告</el-button>
              <el-button size="small" type="success" link @click="finishReport(row)" v-if="row.status === '检验中'">完成检验</el-button>
              <el-button size="small" type="info" link @click="printReport(row)" v-if="row.status === '已出报告'">打印</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 新增检验 -->
      <el-dialog v-model="dialogVisible" title="新增检验申请" width="500px" class="form-dialog">
        <el-form :model="form" label-width="100px">
          <el-form-item label="患者">
            <el-select v-model="form.patientId" filterable placeholder="选择患者" style="width:100%;">
              <el-option v-for="p in patients" :key="p.id" :label="p.name + ' - ' + p.phone" :value="p.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="检验项目">
            <el-select v-model="form.testName" placeholder="选择检验项目" style="width:100%;">
              <el-option v-for="t in testTemplates" :key="t.name" :label="t.name" :value="t.name" @change="onTemplateChange(t)" />
            </el-select>
          </el-form-item>
          <el-form-item label="开单医生"><el-input v-model="form.orderedBy" placeholder="如：郑主任" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveLab">提交申请</el-button>
        </template>
      </el-dialog>

      <!-- 查看报告 -->
      <el-dialog v-model="viewVisible" title="检验报告详情" width="700px" top="5vh">
        <div v-if="currentReport">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="报告编号">{{ currentReport.id }}</el-descriptions-item>
            <el-descriptions-item label="检验项目">{{ currentReport.testName }}</el-descriptions-item>
            <el-descriptions-item label="患者">{{ getPatient(currentReport.patientId)?.name }}</el-descriptions-item>
            <el-descriptions-item label="开单医生">{{ currentReport.orderedBy }}</el-descriptions-item>
            <el-descriptions-item label="采样日期">{{ currentReport.testDate }}</el-descriptions-item>
            <el-descriptions-item label="报告日期">{{ currentReport.resultDate }}</el-descriptions-item>
          </el-descriptions>
          <h4 style="margin:16px 0 8px;">检验结果</h4>
          <el-table :data="currentReport.items" border stripe size="small">
            <el-table-column prop="name" label="项目" width="160" />
            <el-table-column label="结果值" width="120">
              <template #default="{ row }">
                <span :style="{ color: row.flag ? '#f5222d' : '#303133', fontWeight: row.flag ? 'bold' : 'normal' }">
                  {{ row.value }} {{ row.flag }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="100" />
            <el-table-column prop="ref" label="参考范围" width="140" />
            <el-table-column label="提示" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.flag" :type="row.flag === '↑' ? 'danger' : 'warning'" size="small">异常</el-tag>
                <el-tag v-else type="success" size="small">正常</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <template #footer>
          <el-button @click="viewVisible = false">关闭</el-button>
          <el-button type="primary" @click="printReport(currentReport)">打印</el-button>
        </template>
      </el-dialog>
    </div>
  `,
  data() {
    return {
      keyword: '', filterStatus: null, dialogVisible: false, viewVisible: false, currentReport: null,
      form: { patientId: null, testName: '', orderedBy: '' },
      refreshKey: 0,
      testTemplates: [
        { name: '血常规', items: [
          { name: '白细胞计数', value: '', unit: '×10^9/L', ref: '4.0-10.0', flag: '' },
          { name: '红细胞计数', value: '', unit: '×10^12/L', ref: '4.0-5.5', flag: '' },
          { name: '血红蛋白', value: '', unit: 'g/L', ref: '120-160', flag: '' },
          { name: '血小板计数', value: '', unit: '×10^9/L', ref: '100-300', flag: '' }
        ]},
        { name: '生化全项', items: [
          { name: '空腹血糖', value: '', unit: 'mmol/L', ref: '3.9-6.1', flag: '' },
          { name: '总胆固醇', value: '', unit: 'mmol/L', ref: '<5.2', flag: '' },
          { name: '谷丙转氨酶', value: '', unit: 'U/L', ref: '0-40', flag: '' },
          { name: '肌酐', value: '', unit: 'μmol/L', ref: '44-133', flag: '' }
        ]},
        { name: '尿常规', items: [
          { name: '尿蛋白', value: '', unit: '', ref: '阴性', flag: '' },
          { name: '尿糖', value: '', unit: '', ref: '阴性', flag: '' },
          { name: '红细胞', value: '', unit: '/HP', ref: '0-3', flag: '' },
          { name: '白细胞', value: '', unit: '/HP', ref: '0-5', flag: '' }
        ]},
        { name: '肝功能', items: [
          { name: 'ALT', value: '', unit: 'U/L', ref: '0-40', flag: '' },
          { name: 'AST', value: '', unit: 'U/L', ref: '0-40', flag: '' },
          { name: '总胆红素', value: '', unit: 'μmol/L', ref: '3.4-20.5', flag: '' },
          { name: '白蛋白', value: '', unit: 'g/L', ref: '35-55', flag: '' }
        ]}
      ]
    };
  },
  computed: {
    patients() { this.refreshKey; return DB.list(DB.KEYS.PATIENTS); },
    list() { this.refreshKey; return DB.list(DB.KEYS.LAB_RESULTS).sort((a,b) => b.testDate.localeCompare(a.testDate)); },
    filteredList() {
      return this.list.filter(r => {
        if (this.filterStatus && r.status !== this.filterStatus) return false;
        if (!this.keyword) return true;
        const kw = this.keyword.toLowerCase();
        return (r.testName || '').toLowerCase().includes(kw) ||
               (this.getPatient(r.patientId)?.name || '').toLowerCase().includes(kw);
      });
    }
  },
  methods: {
    getPatient(id) { return DB.getById(DB.KEYS.PATIENTS, id); },
    abnormalCount(items) { return (items || []).filter(i => i.flag).length; },
    openAdd() { this.form = { patientId: null, testName: '', orderedBy: '' }; this.dialogVisible = true; },
    onTemplateChange(t) { /* 可选：预填充 */ },
    saveLab() {
      if (!this.form.patientId || !this.form.testName) { this.$message.warning('请完整填写'); return; }
      const tpl = this.testTemplates.find(t => t.name === this.form.testName);
      DB.create(DB.KEYS.LAB_RESULTS, {
        patientId: this.form.patientId,
        testName: this.form.testName,
        testDate: new Date().toISOString().slice(0,10),
        resultDate: '',
        orderedBy: this.form.orderedBy || '检验科',
        items: tpl ? JSON.parse(JSON.stringify(tpl.items)) : [{ name: this.form.testName, value: '', unit: '', ref: '', flag: '' }],
        status: '检验中'
      });
      this.$message.success('检验申请已提交');
      this.dialogVisible = false;
      this.refreshKey++;
    },
    viewReport(row) { this.currentReport = row; this.viewVisible = true; },
    finishReport(row) {
      // 模拟生成结果
      const filledItems = row.items.map(item => {
        const isAbnormal = Math.random() < 0.25;
        let val = '', flag = '';
        const parts = (item.ref || '').split(/[-<>\s]/).filter(Boolean);
        if (parts.length >= 2) {
          const min = parseFloat(parts[0]), max = parseFloat(parts[parts.length-1]);
          if (!isNaN(min) && !isNaN(max)) {
            val = (min + Math.random() * (max - min)).toFixed(1);
            if (isAbnormal) { val = (Math.random() > 0.5 ? max + Math.random() * 5 : min - Math.random() * 3).toFixed(1); flag = Math.random() > 0.5 ? '↑' : '↓'; }
          } else {
            val = isAbnormal ? '异常' : '正常'; flag = isAbnormal ? '↑' : '';
          }
        } else {
          val = isAbnormal ? '阳性' : '阴性'; flag = isAbnormal ? '↑' : '';
        }
        return { ...item, value: val, flag };
      });
      DB.update(DB.KEYS.LAB_RESULTS, row.id, { items: filledItems, status: '已出报告', resultDate: new Date().toISOString().slice(0,10) });
      this.$message.success('检验完成，报告已生成');
      this.refreshKey++;
    },
    printReport(row) {
      const p = this.getPatient(row.patientId);
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>检验报告</title><style>
        body{font-family:sans-serif;padding:30px;max-width:700px;margin:auto;}
        h2{text-align:center;color:#1890ff;}table{width:100%;border-collapse:collapse;margin-top:15px;}
        td,th{padding:8px;border:1px solid #ddd;text-align:left;}
        .abnormal{color:#f5222d;font-weight:bold;}
      </style></head><body>
        <h2>智慧医院 · 检验报告</h2>
        <p>报告编号：${row.id} | 检验项目：${row.testName}</p>
        <p>患者：${p?.name} | 开单医生：${row.orderedBy} | 状态：${row.status}</p>
        <p>采样日期：${row.testDate} | 报告日期：${row.resultDate || '-'}</p>
        <table>
          <tr><th>项目</th><th>结果</th><th>单位</th><th>参考范围</th></tr>
          ${row.items.map(i => `<tr><td>${i.name}</td><td class="${i.flag ? 'abnormal' : ''}">${i.value} ${i.flag}</td><td>${i.unit}</td><td>${i.ref}</td></tr>`).join('')}
        </table>
        <p style="margin-top:20px;color:#909399;">异常结果标注：<span style="color:#f5222d;">↑ ↓</span></p>
        <p style="text-align:center;margin-top:40px;color:#909399;">打印时间：${new Date().toLocaleString()}</p>
      </body></html>`);
      w.document.close(); setTimeout(() => w.print(), 300);
    }
  }
};

window.LabView = LabView;
