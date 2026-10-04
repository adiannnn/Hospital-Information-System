/**
 * 数据层 - 使用 localStorage 持久化
 * 系统首次运行时自动填充 mock 数据
 */
const DB = {
  KEYS: {
    DEPARTMENTS: 'his_departments',
    DOCTORS: 'his_doctors',
    PATIENTS: 'his_patients',
    APPOINTMENTS: 'his_appointments',
    EMR: 'his_emr',
    PRESCRIPTIONS: 'his_prescriptions',
    MEDICINES: 'his_medicines',
    BILLS: 'his_bills',
    LAB_RESULTS: 'his_lab_results',
    INITED: 'his_inited_v1'
  },

  // ========== 基础读写 ==========
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // ========== 通用 CRUD 工厂 ==========
  list(key) { return this.get(key); },
  getById(key, id) { return this.get(key).find(x => x.id === id); },
  create(key, data) {
    const list = this.get(key);
    const id = (list.length > 0 ? Math.max(...list.map(x => x.id)) : 0) + 1;
    const item = { ...data, id, createdAt: new Date().toISOString() };
    list.push(item);
    this.set(key, list);
    return item;
  },
  update(key, id, data) {
    const list = this.get(key);
    const idx = list.findIndex(x => x.id === id);
    if (idx > -1) {
      list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
      this.set(key, list);
      return list[idx];
    }
    return null;
  },
  remove(key, id) {
    const list = this.get(key).filter(x => x.id !== id);
    this.set(key, list);
  },

  // ========== 搜索 ==========
  search(key, keyword, fields) {
    const list = this.get(key);
    if (!keyword) return list;
    const kw = keyword.toLowerCase();
    return list.filter(item =>
      fields.some(f => item[f] && String(item[f]).toLowerCase().includes(kw))
    );
  },

  // ========== 初始化 Mock 数据 ==========
  init() {
    if (localStorage.getItem(this.KEYS.INITED)) return;

    const departments = [
      { id: 1, name: '内科', code: 'NK', description: '包括呼吸、消化、心血管等专业', headDoctor: '张主任', phone: '010-88881001' },
      { id: 2, name: '外科', code: 'WK', description: '包括普外、骨科、心胸外等', headDoctor: '李主任', phone: '010-88881002' },
      { id: 3, name: '儿科', code: 'EK', description: '0-14岁儿童疾病诊治', headDoctor: '王主任', phone: '010-88881003' },
      { id: 4, name: '妇产科', code: 'FCK', description: '妇科疾病与产科服务', headDoctor: '赵主任', phone: '010-88881004' },
      { id: 5, name: '眼科', code: 'YK', description: '眼部疾病诊治与手术', headDoctor: '孙主任', phone: '010-88881005' },
      { id: 6, name: '口腔科', code: 'KQK', description: '牙齿保健与口腔疾病', headDoctor: '周主任', phone: '010-88881006' },
      { id: 7, name: '放射科', code: 'FSK', description: 'X光、CT、MRI影像检查', headDoctor: '吴主任', phone: '010-88881007' },
      { id: 8, name: '检验科', code: 'JYK', description: '血液、尿液、生化检验', headDoctor: '郑主任', phone: '010-88881008' }
    ];

    const doctors = [
      { id: 1, name: '张明远', gender: '男', departmentId: 1, title: '主任医师', specialty: '心血管疾病', phone: '13800138001', email: 'zhangmy@his.com', available: true },
      { id: 2, name: '李雪梅', gender: '女', departmentId: 1, title: '副主任医师', specialty: '呼吸内科', phone: '13800138002', email: 'lixm@his.com', available: true },
      { id: 3, name: '王建国', gender: '男', departmentId: 2, title: '主任医师', specialty: '骨科、关节置换', phone: '13800138003', email: 'wangjg@his.com', available: true },
      { id: 4, name: '赵晓燕', gender: '女', departmentId: 3, title: '主治医师', specialty: '小儿呼吸系统', phone: '13800138004', email: 'zhaoxy@his.com', available: true },
      { id: 5, name: '刘志强', gender: '男', departmentId: 2, title: '副主任医师', specialty: '普外科、腹腔镜', phone: '13800138005', email: 'liuzq@his.com', available: false },
      { id: 6, name: '陈美玲', gender: '女', departmentId: 4, title: '主任医师', specialty: '产科、高危妊娠', phone: '13800138006', email: 'chenml@his.com', available: true },
      { id: 7, name: '孙明亮', gender: '男', departmentId: 5, title: '主治医师', specialty: '白内障、青光眼', phone: '13800138007', email: 'sunml@his.com', available: true },
      { id: 8, name: '周慧敏', gender: '女', departmentId: 6, title: '副主任医师', specialty: '口腔正畸', phone: '13800138008', email: 'zhouhm@his.com', available: true },
      { id: 9, name: '吴海峰', gender: '男', departmentId: 7, title: '主任医师', specialty: 'CT、MRI诊断', phone: '13800138009', email: 'wuhf@his.com', available: true },
      { id: 10, name: '郑雅婷', gender: '女', departmentId: 8, title: '主管技师', specialty: '生化检验', phone: '13800138010', email: 'zhengyt@his.com', available: true }
    ];

    const patients = [
      { id: 1, name: '陈大伟', gender: '男', birthDate: '1965-03-15', idCard: '110101196503151234', phone: '13912345678', address: '北京市朝阳区建国路88号', bloodType: 'A型', allergies: '青霉素' },
      { id: 2, name: '林小芳', gender: '女', birthDate: '1988-07-22', idCard: '110102198807222345', phone: '13987654321', address: '北京市海淀区中关村大街1号', bloodType: 'O型', allergies: '' },
      { id: 3, name: '王小明', gender: '男', birthDate: '2015-11-08', idCard: '110105201511083456', phone: '13600001111', address: '北京市西城区金融街5号', bloodType: 'B型', allergies: '海鲜' },
      { id: 4, name: '黄丽华', gender: '女', birthDate: '1972-01-30', idCard: '110103197201304567', phone: '13522223333', address: '北京市东城区王府井大街100号', bloodType: 'AB型', allergies: '' },
      { id: 5, name: '刘德华', gender: '男', birthDate: '1990-05-18', idCard: '110106199005185678', phone: '13788889999', address: '北京市丰台区南三环西路16号', bloodType: 'A型', allergies: '' },
      { id: 6, name: '张美丽', gender: '女', birthDate: '2002-09-25', idCard: '110108200209256789', phone: '13455556666', address: '北京市昌平区回龙观东大街', bloodType: 'O型', allergies: '芒果' },
      { id: 7, name: '赵大爷', gender: '男', birthDate: '1948-12-10', idCard: '110104194812107890', phone: '13311112222', address: '北京市宣武区广安门内大街', bloodType: 'B型', allergies: '磺胺类药物' },
      { id: 8, name: '钱多多', gender: '女', birthDate: '1985-04-03', idCard: '110107198504038901', phone: '13233334444', address: '北京市石景山区石景山路', bloodType: 'AB型', allergies: '' }
    ];

    const today = new Date();
    const fmtDate = (d) => d.toISOString().slice(0, 10);
    const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmtDate(d); };

    const appointments = [
      { id: 1, patientId: 1, doctorId: 1, departmentId: 1, date: addDays(0), time: '09:00', type: '门诊', status: '已完成', fee: 50, notes: '复查血压' },
      { id: 2, patientId: 2, doctorId: 6, departmentId: 4, date: addDays(0), time: '10:30', type: '门诊', status: '待就诊', fee: 80, notes: '产前检查' },
      { id: 3, patientId: 3, doctorId: 4, departmentId: 3, date: addDays(0), time: '14:00', type: '急诊', status: '进行中', fee: 100, notes: '发烧39度' },
      { id: 4, patientId: 5, doctorId: 3, departmentId: 2, date: addDays(1), time: '09:30', type: '门诊', status: '已预约', fee: 60, notes: '膝盖疼痛' },
      { id: 5, patientId: 6, doctorId: 7, departmentId: 5, date: addDays(1), time: '11:00', type: '门诊', status: '已预约', fee: 50, notes: '视力检查' },
      { id: 6, patientId: 8, doctorId: 2, departmentId: 1, date: addDays(2), time: '15:00', type: '门诊', status: '已预约', fee: 50, notes: '咳嗽两周' }
    ];

    const emrs = [
      {
        id: 1, patientId: 1, doctorId: 1, appointmentId: 1,
        visitDate: addDays(0),
        chiefComplaint: '间断头晕、心悸1周',
        presentIllness: '患者1周前无明显诱因出现头晕、心悸，活动后加重，休息后可缓解。无胸痛、胸闷，无恶心、呕吐。',
        pastHistory: '高血压病史5年，最高血压160/100mmHg，口服硝苯地平缓释片20mg qd。糖尿病史3年。',
        physicalExam: 'BP 145/92mmHg，HR 88次/分，心律齐，各瓣膜听诊区未闻及杂音。双肺呼吸音清。腹软，无压痛。',
        diagnosis: '1. 高血压病2级；2. 2型糖尿病',
        treatmentPlan: '1. 硝苯地平缓释片 20mg 每日一次；2. 二甲双胍 500mg 每日两次；3. 监测血压血糖；4. 低盐低脂饮食；5. 一周后复查。'
      },
      {
        id: 2, patientId: 3, doctorId: 4, appointmentId: 3,
        visitDate: addDays(0),
        chiefComplaint: '发热、咳嗽2天',
        presentIllness: '患儿2天前出现发热，最高体温39.2℃，伴咳嗽、流清涕，无呕吐、腹泻，无抽搐。',
        pastHistory: '既往体健，否认食物药物过敏史（海鲜过敏）。',
        physicalExam: 'T 38.9℃，P 120次/分，R 32次/分。精神可，咽部充血，双肺呼吸音粗，可闻及散在干湿啰音。',
        diagnosis: '1. 急性上呼吸道感染；2. 急性支气管炎',
        treatmentPlan: '1. 布洛芬混悬液退热；2. 头孢克洛干混悬剂 0.125g tid；3. 氨溴特罗口服液止咳化痰；4. 多饮水，注意休息。'
      }
    ];

    const medicines = [
      { id: 1, code: 'YP001', name: '硝苯地平缓释片', category: '西药', unit: '盒', price: 28.50, stock: 320, manufacturer: '拜耳医药', spec: '30mg*7片', location: 'A区-01' },
      { id: 2, code: 'YP002', name: '二甲双胍片', category: '西药', unit: '盒', price: 18.00, stock: 580, manufacturer: '中美上海施贵宝', spec: '0.5g*20片', location: 'A区-02' },
      { id: 3, code: 'YP003', name: '布洛芬混悬液', category: '西药', unit: '瓶', price: 22.00, stock: 150, manufacturer: '强生制药', spec: '100ml', location: 'B区-01' },
      { id: 4, code: 'YP004', name: '头孢克洛干混悬剂', category: '西药', unit: '盒', price: 45.00, stock: 200, manufacturer: '礼来制药', spec: '0.125g*6袋', location: 'B区-02' },
      { id: 5, code: 'YP005', name: '阿莫西林胶囊', category: '西药', unit: '盒', price: 15.50, stock: 420, manufacturer: '华北制药', spec: '0.25g*24粒', location: 'B区-03' },
      { id: 6, code: 'YP006', name: '氨溴特罗口服液', category: '西药', unit: '瓶', price: 32.00, stock: 90, manufacturer: '韩美药品', spec: '100ml', location: 'B区-04' },
      { id: 7, code: 'ZP001', name: '板蓝根颗粒', category: '中成药', unit: '盒', price: 12.50, stock: 680, manufacturer: '白云山制药', spec: '10g*20袋', location: 'C区-01' },
      { id: 8, code: 'ZP002', name: '云南白药胶囊', category: '中成药', unit: '盒', price: 38.00, stock: 210, manufacturer: '云南白药集团', spec: '0.25g*32粒', location: 'C区-02' },
      { id: 9, code: 'YP007', name: '生理盐水注射液', category: '注射液', unit: '袋', price: 5.00, stock: 1200, manufacturer: '双鹤药业', spec: '0.9% 250ml', location: 'D区-01' },
      { id: 10, code: 'YP008', name: '葡萄糖注射液', category: '注射液', unit: '袋', price: 5.50, stock: 980, manufacturer: '双鹤药业', spec: '5% 250ml', location: 'D区-02' }
    ];

    const prescriptions = [
      {
        id: 1, emrId: 1, patientId: 1, doctorId: 1,
        date: addDays(0), status: '已缴费',
        items: [
          { medicineId: 1, name: '硝苯地平缓释片', spec: '30mg*7片', qty: 2, unitPrice: 28.5, total: 57.0 },
          { medicineId: 2, name: '二甲双胍片', spec: '0.5g*20片', qty: 3, unitPrice: 18.0, total: 54.0 }
        ],
        total: 111.0
      },
      {
        id: 2, emrId: 2, patientId: 3, doctorId: 4,
        date: addDays(0), status: '待缴费',
        items: [
          { medicineId: 3, name: '布洛芬混悬液', spec: '100ml', qty: 1, unitPrice: 22.0, total: 22.0 },
          { medicineId: 4, name: '头孢克洛干混悬剂', spec: '0.125g*6袋', qty: 2, unitPrice: 45.0, total: 90.0 },
          { medicineId: 6, name: '氨溴特罗口服液', spec: '100ml', qty: 1, unitPrice: 32.0, total: 32.0 }
        ],
        total: 144.0
      }
    ];

    const bills = [
      {
        id: 1, prescriptionId: 1, patientId: 1,
        date: addDays(0), items: [
          { type: '挂号费', name: '心内科门诊挂号费', amount: 50 },
          { type: '药品费', name: '硝苯地平缓释片 2盒', amount: 57 },
          { type: '药品费', name: '二甲双胍片 3盒', amount: 54 }
        ],
        total: 161, paid: 161, paymentMethod: '微信支付', status: '已结清'
      },
      {
        id: 2, patientId: 3,
        date: addDays(0), items: [
          { type: '挂号费', name: '儿科急诊挂号费', amount: 100 },
          { type: '化验费', name: '血常规', amount: 35 },
          { type: '药品费', name: '退烧药 + 消炎药 + 止咳药', amount: 144 }
        ],
        total: 279, paid: 0, paymentMethod: '', status: '待缴费'
      }
    ];

    const labResults = [
      { id: 1, patientId: 1, testName: '血常规', testDate: addDays(-1), resultDate: addDays(-1), items: [
        { name: '白细胞计数', value: '6.8', unit: '×10^9/L', ref: '4.0-10.0', flag: '' },
        { name: '红细胞计数', value: '4.6', unit: '×10^12/L', ref: '4.0-5.5', flag: '' },
        { name: '血红蛋白', value: '138', unit: 'g/L', ref: '120-160', flag: '' },
        { name: '血小板计数', value: '220', unit: '×10^9/L', ref: '100-300', flag: '' }
      ], status: '已出报告', orderedBy: '郑主任' },
      { id: 2, patientId: 1, testName: '生化全项', testDate: addDays(-1), resultDate: addDays(-1), items: [
        { name: '空腹血糖', value: '7.2', unit: 'mmol/L', ref: '3.9-6.1', flag: '↑' },
        { name: '总胆固醇', value: '5.8', unit: 'mmol/L', ref: '<5.2', flag: '↑' },
        { name: '谷丙转氨酶', value: '28', unit: 'U/L', ref: '0-40', flag: '' },
        { name: '肌酐', value: '76', unit: 'μmol/L', ref: '44-133', flag: '' }
      ], status: '已出报告', orderedBy: '郑主任' },
      { id: 3, patientId: 3, testName: '血常规', testDate: addDays(0), resultDate: addDays(0), items: [
        { name: '白细胞计数', value: '12.5', unit: '×10^9/L', ref: '4.0-10.0', flag: '↑' },
        { name: '中性粒细胞', value: '8.8', unit: '×10^9/L', ref: '2.0-7.0', flag: '↑' },
        { name: '淋巴细胞', value: '2.5', unit: '×10^9/L', ref: '0.8-4.0', flag: '' },
        { name: 'C反应蛋白', value: '28', unit: 'mg/L', ref: '0-10', flag: '↑' }
      ], status: '已出报告', orderedBy: '郑主任' }
    ];

    this.set(this.KEYS.DEPARTMENTS, departments);
    this.set(this.KEYS.DOCTORS, doctors);
    this.set(this.KEYS.PATIENTS, patients);
    this.set(this.KEYS.APPOINTMENTS, appointments);
    this.set(this.KEYS.EMR, emrs);
    this.set(this.KEYS.PRESCRIPTIONS, prescriptions);
    this.set(this.KEYS.MEDICINES, medicines);
    this.set(this.KEYS.BILLS, bills);
    this.set(this.KEYS.LAB_RESULTS, labResults);
    localStorage.setItem(this.KEYS.INITED, '1');
  },

  // ========== 重置所有数据 ==========
  reset() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
    this.init();
  }
};

// 初始化
DB.init();

window.DB = DB;
