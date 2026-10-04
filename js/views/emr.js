/**
 * 电子病历（EMR）
 */
const EMRView = {
  template: `
    <div>
      <div class="page-card">
        <div class="page-title">电子病历</div>

        <!-- 患者选择 -->
        <el-form inline style="margin-bottom:16px;">
          <el-form-item label="患者">
            <el-select v-model="selectedPatientId" filterable placeholder="选择患者" style="width:280px;" @change="onPatientChange">
              <el-option v-for="p in patients" :key="p.id" :label="p.name + ' - ' + p.phone" :value="p.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="selectedPatient">
            <el-tag>性别：{{ selectedPatient.gender }}</el-tag>
            <el-tag>年龄：{{ calcAge(selectedPatient.birthDate) }}</el-tag>
            <el-tag v-if="selectedPatient.bloodType">血型：{{ selectedPatient.bloodType }}</el-tag>
            <el-tag v-if="selectedPatient.allergies" type="danger">过敏：{{ selectedPatient.allergies }}</el-tag>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :disabled="!selectedPatientId" @click="openNewEMR">
              <el-icon><Plus /></el-icon> 新建病历
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 病历列表 -->
        <el-table v-if="selectedPatientId" :data="patientEMRs" stripe border>
          <el-table-column prop="id" label="编号" width="70" />
          <el-table-column prop="visitDate" label="就诊日期" width="120" />
          <el-table-column label="就诊医生" width="130">
            <template #default="{ row }">{{ getDoctor(row.doctorId)?.name }}</template>
          </el-table-column>
          <el-table-column prop="chiefComplaint" label="主诉" min-width="200" show-overflow-tooltip />
          <el-table-column prop="diagnosis" label="诊断" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="viewEMR(row)">查看</el-button>
              <el-button size="small" type="warning" link @click="editEMR(row)">编辑</el-button>
              <el-button size="small" type="danger" link @click="removeEMR(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="请先选择患者" />
      </div>

      <!-- 新建/编辑病历对话框 -->
      <el-dialog v-model="dialogVisible" :title="form.id ? '编辑病历' : '新建病历'" width="780px" top="5vh" class="form-dialog">
        <el-form :model="form" label-width="120px">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="就诊日期">
                <el-date-picker v-model="form.visitDate" type="date" value-format="YYYY-MM-DD" style="width:100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="就诊医生">
                <el-select v-model="form.doctorId" placeholder="选择医生" style="width:100%;">
                  <el-option v-for="d in doctors" :key="d.id" :label="d.name + ' - ' + d.title" :value="d.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="主诉"><el-input v-model="form.chiefComplaint" type="textarea" :rows="2" placeholder="患者主要症状，持续时间" /></el-form-item>
          <el-form-item label="现病史"><el-input v-model="form.presentIllness" type="textarea" :rows="3" /></el-form-item>
          <el-form-item label="既往史"><el-input v-model="form.pastHistory" type="textarea" :rows="2" /></el-form-item>
          <el-form-item label="体格检查"><el-input v-model="form.physicalExam" type="textarea" :rows="2" /></el-form-item>
          <el-form-item label="诊断"><el-input v-model="form.diagnosis" type="textarea" :rows="2" placeholder="如：1. 高血压病2级；2. 2型糖尿病" /></el-form-item>
          <el-form-item label="治疗方案"><el-input v-model="form.treatmentPlan" type="textarea" :rows="3" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEMR">保存病历</el-button>
        </template>
      </el-dialog>

      <!-- 查看病历对话框 -->
      <el-dialog v-model="viewVisible" title="病历详情" width="720px" top="5vh">
        <div v-if="currentEMR" style="line-height:2;">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="病历编号">{{ currentEMR.id }}</el-descriptions-item>
            <el-descriptions-item label="就诊日期">{{ currentEMR.visitDate }}</el-descriptions-item>
            <el-descriptions-item label="患者">{{ selectedPatient?.name }}</el-descriptions-item>
            <el-descriptions-item label="就诊医生">{{ getDoctor(currentEMR.doctorId)?.name }}</el-descriptions-item>
          </el-descriptions>
          <div style="margin-top:16px;">
            <h4 style="color:#1890ff;border-left:4px solid #1890ff;padding-left:8px;margin-bottom:8px;">主诉</h4>
            <p style="padding:12px;background:#fafafa;border-radius:4px;">{{ currentEMR.chiefComplaint }}</p>
          </div>
          <div style="margin-top:12px;">
            <h4 style="color:#1890ff;border-left:4px solid #1890ff;padding-left:8px;margin-bottom:8px;">现病史</h4>
            <p style="padding:12px;background:#fafafa;border-radius:4px;white-space:pre-wrap;">{{ currentEMR.presentIllness }}</p>
          </div>
          <div style="margin-top:12px;">
            <h4 style="color:#1890ff;border-left:4px solid #1890ff;padding-left:8px;margin-bottom:8px;">既往史</h4>
            <p style="padding:12px;background:#fafafa;border-radius:4px;white-space:pre-wrap;">{{ currentEMR.pastHistory || '-' }}</p>
          </div>
          <div style="margin-top:12px;">
            <h4 style="color:#1890ff;border-left:4px solid #1890ff;padding-left:8px;margin-bottom:8px;">体格检查</h4>
            <p style="padding:12px;background:#fafafa;border-radius:4px;white-space:pre-wrap;">{{ currentEMR.physicalExam || '-' }}</p>
          </div>
          <div style="margin-top:12px;">
            <h4 style="color:#f5222d;border-left:4px solid #f5222d;padding-left:8px;margin-bottom:8px;">诊断</h4>
            <p style="padding:12px;background:#fff1f0;border-radius:4px;white-space:pre-wrap;">{{ currentEMR.diagnosis }}</p>
          </div>
          <div style="margin-top:12px;">
            <h4 style="color:#52c41a;border-left:4px solid #52c41a;padding-left:8px;margin-bottom:8px;">治疗方案</h4>
            <p style="padding:12px;background:#f6ffed;border-radius:4px;white-space:pre-wrap;">{{ currentEMR.treatmentPlan }}</p>
          </div>
        </div>
        <template #footer>
          <el-button @click="viewVisible = false">关闭</el-button>
          <el-button type="primary" @click="printEMR">打印病历</el-button>
        </template>
      </el-dialog>
    </div>
  `,
  data() {
    return {
      selectedPatientId: null,
      dialogVisible: false, viewVisible: false, currentEMR: null,
      form: this.emptyForm(),
      refreshKey: 0
    };
  },
  computed: {
    patients() { this.refreshKey; return DB.list(DB.KEYS.PATIENTS); },
    doctors() { this.refreshKey; return DB.list(DB.KEYS.DOCTORS); },
    selectedPatient() { this.refreshKey; return DB.getById(DB.KEYS.PATIENTS, this.selectedPatientId); },
    patientEMRs() {
      this.refreshKey;
      return DB.list(DB.KEYS.EMR).filter(e => e.patientId === this.selectedPatientId).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
    }
  },
  watch: {
    '$route.query.patientId'(val) {
      if (val) this.selectedPatientId = Number(val);
    }
  },
  mounted() {
    if (this.$route.query.patientId) this.selectedPatientId = Number(this.$route.query.patientId);
  },
  methods: {
    emptyForm() {
      return { id: null, patientId: null, doctorId: null, visitDate: new Date().toISOString().slice(0,10), appointmentId: null, chiefComplaint: '', presentIllness: '', pastHistory: '', physicalExam: '', diagnosis: '', treatmentPlan: '' };
    },
    calcAge(birth) {
      if (!birth) return '-';
      return Math.floor((new Date() - new Date(birth)) / (365.25 * 24 * 3600 * 1000));
    },
    getDoctor(id) { return DB.getById(DB.KEYS.DOCTORS, id); },
    onPatientChange() {},
    openNewEMR() {
      this.form = { ...this.emptyForm(), patientId: this.selectedPatientId };
      this.dialogVisible = true;
    },
    viewEMR(row) { this.currentEMR = row; this.viewVisible = true; },
    editEMR(row) { this.form = { ...row }; this.dialogVisible = true; },
    saveEMR() {
      if (!this.form.chiefComplaint || !this.form.diagnosis) {
        this.$message.warning('请填写主诉和诊断'); return;
      }
      if (this.form.id) { DB.update(DB.KEYS.EMR, this.form.id, this.form); this.$message.success('更新成功'); }
      else { DB.create(DB.KEYS.EMR, this.form); this.$message.success('保存成功'); }
      this.dialogVisible = false;
      this.refreshKey++;
    },
    removeEMR(row) {
      this.$confirm('确定删除该病历？', '提示', { type: 'warning' }).then(() => {
        DB.remove(DB.KEYS.EMR, row.id);
        this.$message.success('已删除');
        this.refreshKey++;
      }).catch(() => {});
    },
    printEMR() {
      this.viewVisible = false;
      const r = this.currentEMR;
      const p = this.selectedPatient, d = this.getDoctor(r.doctorId);
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>电子病历</title><style>
        body{font-family:sans-serif;padding:30px;max-width:800px;margin:auto;}
        h1{text-align:center;color:#1890ff;}h2{border-left:4px solid #1890ff;padding-left:8px;margin-top:20px;}
        .info{display:flex;justify-content:space-between;background:#fafafa;padding:15px;border-radius:4px;}
        .section{padding:12px;background:#fafafa;border-radius:4px;white-space:pre-wrap;margin-top:8px;}
      </style></head><body>
        <h1>智慧医院 · 电子病历</h1>
        <div class="info">
          <div>病历号：${r.id} | 就诊日期：${r.visitDate}</div>
          <div>就诊医生：${d?.name} ${d?.title}</div>
        </div>
        <div class="info" style="margin-top:10px;">
          <div>患者：${p?.name} | ${p?.gender} | ${this.calcAge(p?.birthDate)}岁</div>
          <div>身份证：${p?.idCard || '-'}</div>
        </div>
        <h2>主诉</h2><div class="section">${r.chiefComplaint}</div>
        <h2>现病史</h2><div class="section">${r.presentIllness}</div>
        <h2>既往史</h2><div class="section">${r.pastHistory || '-'}</div>
        <h2>体格检查</h2><div class="section">${r.physicalExam || '-'}</div>
        <h2>诊断</h2><div class="section" style="background:#fff1f0;">${r.diagnosis}</div>
        <h2>治疗方案</h2><div class="section" style="background:#f6ffed;">${r.treatmentPlan}</div>
        <p style="text-align:center;margin-top:40px;color:#909399;">打印时间：${new Date().toLocaleString()}</p>
      </body></html>`);
      w.document.close(); setTimeout(() => w.print(), 300);
    }
  }
};

window.EMRView = EMRView;
