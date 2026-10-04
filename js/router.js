/**
 * 路由配置 - 用 window 显式引用，避免跨 script 变量作用域问题
 */
const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: window.DashboardView, meta: { title: '工作台', icon: 'Odometer' } },
  { path: '/departments', component: window.DepartmentsView, meta: { title: '科室管理', icon: 'OfficeBuilding' } },
  { path: '/doctors', component: window.DoctorsView, meta: { title: '医生管理', icon: 'User' } },
  { path: '/patients', component: window.PatientsView, meta: { title: '患者管理', icon: 'UserFilled' } },
  { path: '/appointments', component: window.AppointmentsView, meta: { title: '挂号管理', icon: 'Calendar' } },
  { path: '/emr', component: window.EMRView, meta: { title: '电子病历', icon: 'Document' } },
  { path: '/prescriptions', component: window.PrescriptionsView, meta: { title: '处方管理', icon: 'Tickets' } },
  { path: '/pharmacy', component: window.PharmacyView, meta: { title: '药品管理', icon: 'FirstAidKit' } },
  { path: '/billing', component: window.BillingView, meta: { title: '收费管理', icon: 'Money' } },
  { path: '/lab', component: window.LabView, meta: { title: '检验报告', icon: 'DataAnalysis' } }
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes
});

window.router = router;
