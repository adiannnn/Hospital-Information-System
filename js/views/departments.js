/**
 * 科室管理
 */
const DepartmentsView = {
  template: `
    <div>
      <div class="page-card">
        <div class="page-title">科室管理</div>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="keyword" placeholder="搜索科室名称/编码" clearable style="width:260px;">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
          <div>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增科室</el-button>
          </div>
        </div>

        <el-table :data="filteredList" stripe border>
          <el-table-column prop="id" label="编号" width="70" />
          <el-table-column prop="name" label="科室名称" width="140" />
          <el-table-column prop="code" label="编码" width="100" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="headDoctor" label="负责人" width="120" />
          <el-table-column prop="phone" label="联系电话" width="150" />
          <el-table-column label="医生数" width="100">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ doctorCount(row.id) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" link @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 新增/编辑对话框 -->
      <el-dialog v-model="dialogVisible" :title="form.id ? '编辑科室' : '新增科室'" width="520px" class="form-dialog">
        <el-form :model="form" label-width="90px">
          <el-form-item label="科室名称"><el-input v-model="form.name" placeholder="如：内科" /></el-form-item>
          <el-form-item label="科室编码"><el-input v-model="form.code" placeholder="如：NK" /></el-form-item>
          <el-form-item label="负责人"><el-input v-model="form.headDoctor" placeholder="科室主任姓名" /></el-form-item>
          <el-form-item label="联系电话"><el-input v-model="form.phone" placeholder="联系电话" /></el-form-item>
          <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
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
    list() { this.refreshKey; return DB.list(DB.KEYS.DEPARTMENTS); },
    filteredList() {
      if (!this.keyword) return this.list;
      const kw = this.keyword.toLowerCase();
      return this.list.filter(d => d.name.toLowerCase().includes(kw) || d.code.toLowerCase().includes(kw));
    }
  },
  methods: {
    emptyForm() { return { id: null, name: '', code: '', description: '', headDoctor: '', phone: '' }; },
    doctorCount(deptId) {
      return DB.list(DB.KEYS.DOCTORS).filter(d => d.departmentId === deptId).length;
    },
    openAdd() { this.form = this.emptyForm(); this.dialogVisible = true; },
    openEdit(row) { this.form = { ...row }; this.dialogVisible = true; },
    save() {
      if (!this.form.name || !this.form.code) {
        this.$message.warning('请填写科室名称和编码'); return;
      }
      if (this.form.id) {
        DB.update(DB.KEYS.DEPARTMENTS, this.form.id, this.form);
        this.$message.success('更新成功');
      } else {
        DB.create(DB.KEYS.DEPARTMENTS, this.form);
        this.$message.success('新增成功');
      }
      this.dialogVisible = false;
      this.refreshKey++;
    },
    remove(row) {
      this.$confirm(`确定删除科室"${row.name}"？`, '提示', { type: 'warning' }).then(() => {
        DB.remove(DB.KEYS.DEPARTMENTS, row.id);
        this.$message.success('已删除');
        this.refreshKey++;
      }).catch(() => {});
    }
  }
};

window.DepartmentsView = DepartmentsView;
