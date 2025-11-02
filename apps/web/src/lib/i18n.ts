import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.domains': 'Domains',
      'nav.modsecurity': 'ModSecurity',
      'nav.ssl': 'SSL Certificates',
      'nav.logs': 'Logs',
      'nav.alerts': 'Alerts',
      'nav.acl': 'Access Control',
      'nav.access-lists': 'Access Lists',
      'nav.performance': 'Performance',
      'nav.backup': 'Backup & Restore',
      'nav.users': 'User Management',
      'nav.nodes': 'Slave Nodes',
      'nav.network': 'Network Manager',
      'nav.plugins': 'Plugins',
      
      // Login
      'login.title': 'Admin Portal',
      'login.username': 'Username',
      'login.password': 'Password',
      'login.2fa': '2FA Code',
      'login.signin': 'Sign In',
      
      // Dashboard
      'dashboard.title': 'Dashboard',
      'dashboard.overview': 'System Overview',
      'dashboard.domains': 'Total Domains',
      'dashboard.traffic': 'Traffic',
      'dashboard.errors': 'Errors',
      'dashboard.uptime': 'Uptime',
      
      // Dashboard Analytics
      'dashboard.requestTrend': 'Request Trend',
      'dashboard.requestTrendDesc': 'Real-time request statistics by HTTP status',
      'dashboard.slowRequests': 'Slow Requests',
      'dashboard.slowRequestsDesc': 'Top 10 slowest URL paths',
      'dashboard.latestAttacks': 'Latest Attacks',
      'dashboard.latestAttacksDesc': 'Top 5 attack types in 24 hours',
      'dashboard.latestNews': 'Latest Security Events',
      'dashboard.latestNewsDesc': 'Recent security incidents',
      'dashboard.requestAnalytics': 'Request Analytics',
      'dashboard.requestAnalyticsDesc': 'Top 10 IP addresses by period',
      'dashboard.attackRatio': 'Attack vs Normal Requests',
      'dashboard.attackRatioDesc': 'Security threat ratio',
      'dashboard.path': 'Path',
      'dashboard.avgResponseTime': 'Avg Response Time',
      'dashboard.requestCount': 'Request Count',
      'dashboard.attackType': 'Attack Type',
      'dashboard.count': 'Count',
      'dashboard.severity': 'Severity',
      'dashboard.lastOccurred': 'Last Occurred',
      'dashboard.timestamp': 'Timestamp',
      'dashboard.attackerIp': 'Attacker IP',
      'dashboard.domain': 'Target Domain',
      'dashboard.urlPath': 'URL Path',
      'dashboard.action': 'Action',
      'dashboard.viewDetails': 'View Details',
      'dashboard.actions': 'Actions',
      'dashboard.sourceIp': 'Source IP',
      'dashboard.totalRequests': 'Total Requests',
      'dashboard.attackRequests': 'Attack Requests',
      'dashboard.normalRequests': 'Normal Requests',
      'dashboard.attackPercentage': 'Attack Percentage',
      'dashboard.period.day': 'Today',
      'dashboard.period.week': 'This Week',
      'dashboard.period.month': 'This Month',
      'dashboard.status200': '200 OK',
      'dashboard.status301': '301 Redirect',
      'dashboard.status302': '302 Redirect',
      'dashboard.status400': '400 Bad Request',
      'dashboard.status403': '403 Forbidden',
      'dashboard.status404': '404 Not Found',
      'dashboard.status500': '500 Server Error',
      'dashboard.status502': '502 Bad Gateway',
      'dashboard.status503': '503 Service Unavailable',
      'dashboard.statusOther': 'Other',
      'dashboard.noData': 'No data available',
      
      // Domains
      'domains.title': 'Domain Management',
      'domains.add': 'Add Domain',
      'domains.search': 'Search domains...',
      'domains.name': 'Domain Name',
      'domains.status': 'Status',
      'domains.ssl': 'SSL',
      'domains.modsec': 'ModSecurity',
      'domains.actions': 'Actions',
      
      // ModSecurity
      'modsec.title': 'ModSecurity Configuration',
      'modsec.global': 'Global Settings',
      'modsec.rules': 'CRS Rules',
      'modsec.custom': 'Custom Rules',
      
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.enabled': 'Enabled',
      'common.disabled': 'Disabled',
      'common.active': 'Active',
      'common.inactive': 'Inactive',
    }
  },
  vi: {
    translation: {
      // Navigation
      'nav.dashboard': 'Bảng điều khiển',
      'nav.domains': 'Tên miền',
      'nav.modsecurity': 'ModSecurity',
      'nav.ssl': 'Chứng chỉ SSL',
      'nav.logs': 'Nhật ký',
      'nav.alerts': 'Cảnh báo',
      'nav.acl': 'Kiểm soát truy cập',
      'nav.access-lists': 'Danh sách truy cập',
      'nav.performance': 'Hiệu suất',
      'nav.backup': 'Sao lưu & Khôi phục',
      'nav.users': 'Quản lý người dùng',
      'nav.nodes': 'Nút phụ',
      'nav.network': 'Quản lý mạng',
      'nav.plugins': 'Plugin',
      
      // Login
      'login.title': 'Cổng Quản Trị',
      'login.username': 'Tên đăng nhập',
      'login.password': 'Mật khẩu',
      'login.2fa': 'Mã 2FA',
      'login.signin': 'Đăng nhập',
      
      // Dashboard
      'dashboard.title': 'Bảng điều khiển',
      'dashboard.overview': 'Tổng quan hệ thống',
      'dashboard.domains': 'Tổng số tên miền',
      'dashboard.traffic': 'Lưu lượng',
      'dashboard.errors': 'Lỗi',
      'dashboard.uptime': 'Thời gian hoạt động',
      
      // Dashboard Analytics
      'dashboard.requestTrend': 'Xu hướng Request',
      'dashboard.requestTrendDesc': 'Thống kê request theo trạng thái HTTP',
      'dashboard.slowRequests': 'Request Chậm',
      'dashboard.slowRequestsDesc': 'Top 10 URL path chậm nhất',
      'dashboard.latestAttacks': 'Tấn công mới nhất',
      'dashboard.latestAttacksDesc': 'Top 5 loại tấn công trong 24h',
      'dashboard.latestNews': 'Sự kiện bảo mật',
      'dashboard.latestNewsDesc': 'Sự cố bảo mật gần đây',
      'dashboard.requestAnalytics': 'Phân tích Request',
      'dashboard.requestAnalyticsDesc': 'Top 10 địa chỉ IP theo thời gian',
      'dashboard.attackRatio': 'Tỷ lệ Tấn công',
      'dashboard.attackRatioDesc': 'Tỷ lệ mối đe dọa bảo mật',
      'dashboard.path': 'Đường dẫn',
      'dashboard.avgResponseTime': 'Thời gian phản hồi TB',
      'dashboard.requestCount': 'Số lượng request',
      'dashboard.attackType': 'Loại tấn công',
      'dashboard.count': 'Số lượng',
      'dashboard.severity': 'Mức độ nghiêm trọng',
      'dashboard.lastOccurred': 'Lần cuối xảy ra',
      'dashboard.timestamp': 'Thời gian',
      'dashboard.attackerIp': 'IP tấn công',
      'dashboard.domain': 'Domain đích',
      'dashboard.urlPath': 'Đường dẫn URL',
      'dashboard.action': 'Hành động',
      'dashboard.viewDetails': 'Xem chi tiết',
      'dashboard.actions': 'Thao tác',
      'dashboard.sourceIp': 'IP nguồn',
      'dashboard.totalRequests': 'Tổng số request',
      'dashboard.attackRequests': 'Request tấn công',
      'dashboard.normalRequests': 'Request bình thường',
      'dashboard.attackPercentage': 'Tỷ lệ tấn công',
      'dashboard.period.day': 'Hôm nay',
      'dashboard.period.week': 'Tuần này',
      'dashboard.period.month': 'Tháng này',
      'dashboard.status200': '200 OK',
      'dashboard.status301': '301 Chuyển hướng',
      'dashboard.status302': '302 Chuyển hướng',
      'dashboard.status400': '400 Yêu cầu không hợp lệ',
      'dashboard.status403': '403 Bị cấm',
      'dashboard.status404': '404 Không tìm thấy',
      'dashboard.status500': '500 Lỗi máy chủ',
      'dashboard.status502': '502 Bad Gateway',
      'dashboard.status503': '503 Dịch vụ không khả dụng',
      'dashboard.statusOther': 'Khác',
      'dashboard.noData': 'Không có dữ liệu',
      
      // Domains
      'domains.title': 'Quản lý tên miền',
      'domains.add': 'Thêm tên miền',
      'domains.search': 'Tìm kiếm tên miền...',
      'domains.name': 'Tên miền',
      'domains.status': 'Trạng thái',
      'domains.ssl': 'SSL',
      'domains.modsec': 'ModSecurity',
      'domains.actions': 'Hành động',
      
      // ModSecurity
      'modsec.title': 'Cấu hình ModSecurity',
      'modsec.global': 'Cài đặt toàn cục',
      'modsec.rules': 'Quy tắc CRS',
      'modsec.custom': 'Quy tắc tùy chỉnh',
      
      // Common
      'common.save': 'Lưu',
      'common.cancel': 'Hủy',
      'common.delete': 'Xóa',
      'common.edit': 'Sửa',
      'common.enabled': 'Đã bật',
      'common.disabled': 'Đã tắt',
      'common.active': 'Hoạt động',
      'common.inactive': 'Không hoạt động',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
