/**
 * 医生管理
 */
const DoctorsView = {
  template: `
    <div>
      <div class="page-card">
        <div class="page-title">医生管理</div>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="keyword" placeholder="姓名/职称/专业" clearable style="width:260px;">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-select v-model="filterDept" placeholder="全部科室" clearable style="width:160px;">
              <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </div>
          <div>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增医生</el-button>
          </div>
        </div>

        <el-table :data="filteredList" stripe border>
          <el-table-column prop="id" label="编号" width="70" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="gender" label="性别" width="70" />
          <el-table-column label="所属科室" width="120">
            <template #default="{ row }">{{ getDept(row.departmentId)?.name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="title" label="职称" width="120" />
          <el-table-column prop="specialty" label="擅长" min-width="160" />
          <el-table-column prop="phone" label="联系电话" width="140" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.available ? 'success' : 'info'" size="small">
                {{ row.available ? '出诊中' : '停诊' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="warning" link @click="toggleStatus(row)">
                {{ row.available ? '停诊' : '出诊' }}
              </el-button>
              <el-button size="small" type="danger" link @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-dialog v-model="dialogVisible" :title="form.id ? '编辑医生' : '新增医生'" width="520px" class="form-dialog">
        <el-form :model="form" label-width="90px">
          <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
          <el-form-item label="性别">
            <el-radio-group v-model="form.gender">
              <el-radio value="男">男</el-radio>
              <el-radio value="女">女</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="科室">
            <el-select v-model="form.departmentId" placeholder="选择科室" style="width:100%;">
              <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="职称">
            <el-select v-model="form.title" style="width:100%;">
              <el-option label="住院医师" value="住院医师" />
              <el-option label="主治医师" value="主治医师" />
              <el-option label="副主任医师" value="副主任医师" />
              <el-option label="主任医师" value="主任医师" />
              <el-option label="主管技师" value="主管技师" />
            </el-select>
          </el-form-item>
          <el-form-item label="擅长"><el-input v-model="form.specialty" /></el-form-item>
          <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.available" active-text="出诊中" inactive-text="停诊" />
          </el-form-item>
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
      keyword: '', filterDept: null,
      dialogVisible: false,
      form: this.emptyForm(),
      refreshKey: 0
    };
  },
  computed: {
    departments() { this.refreshKey; return DB.list(DB.KEYS.DEPARTMENTS); },
    list() { this.refreshKey; return DB.list(DB.KEYS.DOCTORS); },
    filteredList() {
      return this.list.filter(d => {
        if (this.filterDept && d.departmentId !== this.filterDept) return false;
        if (!this.keyword) return true;
        const kw = this.keyword.toLowerCase();
        return (d.name || '').toLowerCase().includes(kw) ||
               (d.title || '').toLowerCase().includes(kw) ||
               (d.specialty || '').toLowerCase().includes(kw);
      });
    }
  },
  methods: {
    emptyForm() { return { id: null, name: '', gender: '男', departmentId: null, title: '主治医师', specialty: '', phone: '', email: '', available: true }; },
    getDept(id) { return DB.getById(DB.KEYS.DEPARTMENTS, id); },
    openAdd() { this.form = this.emptyForm(); this.dialogVisible = true; },
    openEdit(row) { this.form = { ...row }; this.dialogVisible = true; },
    save() {
      if (!this.form.name || !this.form.departmentId) {
        this.$message.warning('请填写姓名和所属科室'); return;
      }
      if (this.form.id) { DB.update(DB.KEYS.DOCTORS, this.form.id, this.form); this.$message.success('更新成功'); }
      else { DB.create(DB.KEYS.DOCTORS, this.form); this.$message.success('新增成功'); }
      this.dialogVisible = false;
      this.refreshKey++;
    },
    toggleStatus(row) {
      DB.update(DB.KEYS.DOCTORS, row.id, { available: !row.available });
      this.$message.success('状态已更新');
      this.refreshKey++;
    },
    remove(row) {
      this.$confirm(`确定删除医生"${row.name}"？`, '提示', { type: 'warning' }).then(() => {
        DB.remove(DB.KEYS.DOCTORS, row.id);
        this.$message.success('已删除');
        this.refreshKey++;
      }).catch(() => {});
    }
  }
};

window.DoctorsView = DoctorsView;
