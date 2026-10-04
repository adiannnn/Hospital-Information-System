/**
 * 患者管理
 */
const PatientsView = {
  template: `
    <div>
      <div class="page-card">
        <div class="page-title">患者管理</div>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="keyword" placeholder="姓名/身份证/手机号" clearable style="width:300px;">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
          <div>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增患者</el-button>
          </div>
        </div>

        <el-table :data="filteredList" stripe border>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="gender" label="性别" width="70" />
          <el-table-column label="年龄" width="80">
            <template #default="{ row }">{{ calcAge(row.birthDate) }}</template>
          </el-table-column>
          <el-table-column prop="idCard" label="身份证号" width="180" />
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column prop="bloodType" label="血型" width="70" />
          <el-table-column prop="allergies" label="过敏史" width="140" show-overflow-tooltip />
          <el-table-column prop="address" label="住址" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="success" link @click="goEMR(row)">病历</el-button>
              <el-button size="small" type="danger" link @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-dialog v-model="dialogVisible" :title="form.id ? '编辑患者' : '新增患者'" width="560px" class="form-dialog">
        <el-form :model="form" label-width="90px">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别">
                <el-radio-group v-model="form.gender">
                  <el-radio value="男">男</el-radio><el-radio value="女">女</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="出生日期">
                <el-date-picker v-model="form.birthDate" type="date" value-format="YYYY-MM-DD" style="width:100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="血型">
                <el-select v-model="form.bloodType" style="width:100%;">
                  <el-option v-for="b in ['A型','B型','AB型','O型','未知']" :key="b" :label="b" :value="b" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="身份证号"><el-input v-model="form.idCard" /></el-form-item>
          <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
          <el-form-item label="过敏史"><el-input v-model="form.allergies" placeholder="如：青霉素、海鲜" /></el-form-item>
          <el-form-item label="住址"><el-input v-model="form.address" /></el-form-item>
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
      keyword: '',
      dialogVisible: false,
      form: this.emptyForm(),
      refreshKey: 0
    };
  },
  computed: {
    list() { this.refreshKey; return DB.list(DB.KEYS.PATIENTS); },
    filteredList() {
      if (!this.keyword) return this.list;
      const kw = this.keyword.toLowerCase();
      return this.list.filter(p =>
        (p.name || '').toLowerCase().includes(kw) ||
        (p.idCard || '').toLowerCase().includes(kw) ||
        (p.phone || '').toLowerCase().includes(kw)
      );
    }
  },
  methods: {
    emptyForm() { return { id: null, name: '', gender: '男', birthDate: '', idCard: '', phone: '', address: '', bloodType: 'A型', allergies: '' }; },
    calcAge(birth) {
      if (!birth) return '-';
      const b = new Date(birth); const now = new Date();
      return Math.floor((now - b) / (365.25 * 24 * 3600 * 1000));
    },
    openAdd() { this.form = this.emptyForm(); this.dialogVisible = true; },
    openEdit(row) { this.form = { ...row }; this.dialogVisible = true; },
    save() {
      if (!this.form.name) { this.$message.warning('请填写姓名'); return; }
      if (this.form.id) { DB.update(DB.KEYS.PATIENTS, this.form.id, this.form); this.$message.success('更新成功'); }
      else { DB.create(DB.KEYS.PATIENTS, this.form); this.$message.success('新增成功'); }
      this.dialogVisible = false;
      this.refreshKey++;
    },
    goEMR(row) {
      this.$router.push({ path: '/emr', query: { patientId: row.id } });
    },
    remove(row) {
      this.$confirm(`确定删除患者"${row.name}"？`, '提示', { type: 'warning' }).then(() => {
        DB.remove(DB.KEYS.PATIENTS, row.id);
        this.$message.success('已删除');
        this.refreshKey++;
      }).catch(() => {});
    }
  }
};

window.PatientsView = PatientsView;
