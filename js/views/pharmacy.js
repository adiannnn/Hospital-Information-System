/**
 * 药品管理（药房库存）
 */
const PharmacyView = {
  template: `
    <div>
      <div class="page-card">
        <div class="page-title">药品管理</div>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="keyword" placeholder="药品名称/编码" clearable style="width:240px;">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-select v-model="filterCategory" placeholder="全部类别" clearable style="width:140px;">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
            <el-switch v-model="lowStockOnly" active-text="仅低库存" inactive-text="全部" />
          </div>
          <div>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增药品</el-button>
            <el-button type="warning" :icon="Download" @click="batchIn">批量入库</el-button>
          </div>
        </div>

        <el-table :data="filteredList" stripe border>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="code" label="编码" width="100" />
          <el-table-column prop="name" label="药品名称" width="160" />
          <el-table-column prop="spec" label="规格" width="140" />
          <el-table-column prop="category" label="类别" width="90">
            <template #default="{ row }">
              <el-tag :type="row.category === '西药' ? '' : (row.category === '中成药' ? 'success' : 'warning')" size="small">
                {{ row.category }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="70" />
          <el-table-column label="单价" width="90">
            <template #default="{ row }">¥{{ row.price?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="库存" width="100">
            <template #default="{ row }">
              <span :style="{ color: row.stock < 100 ? '#f5222d' : '#303133', fontWeight: row.stock < 100 ? 'bold' : 'normal' }">
                {{ row.stock }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="库位" width="90" />
          <el-table-column prop="manufacturer" label="生产厂家" min-width="140" show-overflow-tooltip />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="success" link @click="stockIn(row)">入库</el-button>
              <el-button size="small" type="danger" link @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="lowStockList.length > 0" style="margin-top:16px;padding:12px;background:#fff1f0;border:1px solid #ffa39e;border-radius:4px;">
          <b style="color:#f5222d;">⚠ 库存预警（{{ lowStockList.length }} 种药品）：</b>
          <span style="margin-left:8px;">
            <el-tag v-for="m in lowStockList" :key="m.id" type="danger" size="small" style="margin-right:6px;margin-top:4px;">
              {{ m.name }}（{{ m.stock }}）
            </el-tag>
          </span>
        </div>
      </div>

      <el-dialog v-model="dialogVisible" :title="form.id ? '编辑药品' : '新增药品'" width="520px" class="form-dialog">
        <el-form :model="form" label-width="90px">
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item label="编码"><el-input v-model="form.code" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="名称"><el-input v-model="form.name" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="类别">
                <el-select v-model="form.category" style="width:100%;">
                  <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12"><el-form-item label="规格"><el-input v-model="form.spec" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8"><el-form-item label="单位"><el-input v-model="form.unit" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="单价"><el-input-number v-model="form.price" :min="0" :precision="2" style="width:100%;" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="初始库存"><el-input-number v-model="form.stock" :min="0" style="width:100%;" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item label="库位"><el-input v-model="form.location" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="生产厂家"><el-input v-model="form.manufacturer" /></el-form-item></el-col>
          </el-row>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="stockVisible" title="药品入库" width="400px" class="form-dialog">
        <el-form label-width="90px">
          <el-form-item label="药品">{{ currentMed?.name }}</el-form-item>
          <el-form-item label="当前库存">{{ currentMed?.stock }}</el-form-item>
          <el-form-item label="入库数量">
            <el-input-number v-model="stockQty" :min="1" style="width:100%;" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="stockVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmStockIn">确认入库</el-button>
        </template>
      </el-dialog>
    </div>
  `,
  data() {
    return {
      keyword: '', filterCategory: null, lowStockOnly: false,
      dialogVisible: false, stockVisible: false,
      form: this.emptyForm(), currentMed: null, stockQty: 100,
      categories: ['西药', '中成药', '中药饮片', '注射液', '医疗器械'],
      refreshKey: 0
    };
  },
  computed: {
    list() { this.refreshKey; return DB.list(DB.KEYS.MEDICINES); },
    lowStockList() { return this.list.filter(m => m.stock < 100); },
    filteredList() {
      return this.list.filter(m => {
        if (this.filterCategory && m.category !== this.filterCategory) return false;
        if (this.lowStockOnly && m.stock >= 100) return false;
        if (!this.keyword) return true;
        const kw = this.keyword.toLowerCase();
        return (m.name || '').toLowerCase().includes(kw) || (m.code || '').toLowerCase().includes(kw);
      });
    }
  },
  methods: {
    emptyForm() { return { id: null, code: '', name: '', category: '西药', unit: '盒', price: 0, stock: 0, manufacturer: '', spec: '', location: '' }; },
    openAdd() { this.form = this.emptyForm(); this.dialogVisible = true; },
    openEdit(row) { this.form = { ...row }; this.dialogVisible = true; },
    save() {
      if (!this.form.name || !this.form.code) { this.$message.warning('请填写药品名称和编码'); return; }
      if (this.form.id) { DB.update(DB.KEYS.MEDICINES, this.form.id, this.form); this.$message.success('更新成功'); }
      else { DB.create(DB.KEYS.MEDICINES, this.form); this.$message.success('新增成功'); }
      this.dialogVisible = false;
      this.refreshKey++;
    },
    stockIn(row) { this.currentMed = row; this.stockQty = 100; this.stockVisible = true; },
    confirmStockIn() {
      DB.update(DB.KEYS.MEDICINES, this.currentMed.id, { stock: this.currentMed.stock + this.stockQty });
      this.$message.success(`入库成功，新增 ${this.stockQty}`);
      this.stockVisible = false;
      this.refreshKey++;
    },
    batchIn() {
      let count = 0;
      this.lowStockList.forEach(m => { DB.update(DB.KEYS.MEDICINES, m.id, { stock: m.stock + 200 }); count++; });
      if (count === 0) { this.$message.info('暂无低库存药品'); }
      else { this.$message.success(`已对 ${count} 种低库存药品各入库 200`); this.refreshKey++; }
    },
    remove(row) {
      this.$confirm(`确定删除药品"${row.name}"？`, '提示', { type: 'warning' }).then(() => {
        DB.remove(DB.KEYS.MEDICINES, row.id); this.$message.success('已删除');
        this.refreshKey++;
      }).catch(() => {});
    }
  }
};

window.PharmacyView = PharmacyView;
