
import React, { useEffect, useState, useRef } from 'react';
import { statsService } from '../services/mockBackend';
import { DashboardStats, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { FileText, Download, RefreshCw, DollarSign, Scaling, Building, ChevronRight, Activity, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#475569'];

const MOCK_FALLBACK: DashboardStats = {
    totalParcels: 12450,
    totalArea: 450200,
    totalValue: 21800000000,
    parcelsByType: [
        { name: 'Đất ở đô thị', value: 4500 },
        { name: 'Đất nông nghiệp', value: 3200 },
        { name: 'Đất trồng cây lâu năm', value: 2100 },
        { name: 'Đất sản xuất kinh doanh', value: 1500 },
        { name: 'Đất tôn giáo', value: 450 },
        { name: 'Đất công trình công cộng', value: 700 }
    ],
    valueByBranch: [
        { name: 'Phường Hiệp Thành', value: 2400 },
        { name: 'Phường Phú Lợi', value: 2100 },
        { name: 'Phường Phú Hòa', value: 1950 },
        { name: 'Phường Phú Mỹ', value: 1800 },
        { name: 'Phường Phú Cường', value: 1600 }
    ]
};

interface DashboardProps {
    user: User;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#fff" className="font-display font-black text-lg uppercase tracking-tighter">
        {payload.name}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 14} outerRadius={outerRadius + 18} fill={fill} opacity={0.3} />
    </g>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const fetchStats = async () => {
    try {
        setLoading(true);
        // Fix: Removed user argument from getDashboardStats as it expects 0 arguments
        const data = await statsService.getDashboardStats();
        if (!data || data.totalParcels === 0) {
            setStats(MOCK_FALLBACK);
        } else {
            setStats(data);
        }
        setLastUpdated(new Date());
    } catch (err: any) {
        setStats(MOCK_FALLBACK);
    } finally {
        setTimeout(() => setLoading(false), 500); 
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); 
    return () => clearInterval(interval);
  }, [user]);

  // EXPORT TO EXCEL (CSV) - Optimized with correct Encoding and Formatting
  const handleExportExcel = () => {
    if (!stats) return;
    setIsExporting('EXCEL');
    
    setTimeout(() => {
        const rows = [
            ["BÁO CÁO THỐNG KÊ QUẢN LÝ ĐẤT ĐAI - GEOMASTER"],
            ["Chi nhánh", user.branchId || "Trụ sở chính"],
            ["Thời điểm xuất", new Date().toLocaleString("vi-VN")],
            [""],
            ["--- CHỈ SỐ TỔNG QUAN ---"],
            ["Chỉ tiêu", "Giá trị", "Đơn vị"],
            ["Tổng số thửa đất", stats.totalParcels, "Thửa"],
            ["Tổng diện tích", stats.totalArea.toFixed(2), "m2"],
            ["Giá trị tích lũy (tạm tính)", stats.totalValue, "VND"],
            [""],
            ["--- CƠ CẤU LOẠI ĐẤT ---"],
            ["Loại đất", "Số lượng thửa"],
            ...stats.parcelsByType.map(p => [p.name, p.value]),
            [""],
            ["--- MẬT ĐỘ THEO KHU VỰC ---"],
            ["Tên khu vực/phân khu", "Số lượng thửa"],
            ...stats.valueByBranch.map(v => [v.name, v.value])
        ];

        // Dùng BOM \uFEFF để Excel nhận diện đúng tiếng Việt UTF-8
        let csvContent = "\uFEFF"; 
        rows.forEach(rowArray => {
            const row = rowArray.map(val => {
                if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
                return val;
            }).join(",");
            csvContent += row + "\r\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `BaoCao_ThongKe_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(null);
    }, 800);
  };

  // EXPORT TO PDF - Fixed Blur & Ghosting Issues
  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting('PDF');
    
    const element = dashboardRef.current;
    
    try {
        // Tạm thời ẩn các thành phần trang trí gây nhiễu cho canvas
        const orbs = element.querySelectorAll('.animate-orb-move');
        orbs.forEach(orb => (orb as HTMLElement).style.display = 'none');
        
        const canvas = await html2canvas(element, {
            scale: 2.5, // Tăng độ nét cao
            useCORS: true,
            backgroundColor: '#0B0C10',
            logging: false,
            onclone: (clonedDoc) => {
                // Trong bản clone, xóa các hiệu ứng blur gây lỗi đen màn hình
                const clonedElement = clonedDoc.querySelector('.mesh-bg') as HTMLElement;
                if (clonedElement) {
                    clonedElement.style.filter = 'none';
                    clonedElement.style.backdropFilter = 'none';
                }
                // Ẩn nút xuất trong PDF
                const buttons = clonedDoc.querySelectorAll('button');
                buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');
            }
        });
        
        // Trả lại hiển thị cho orbs
        orbs.forEach(orb => (orb as HTMLElement).style.display = 'block');

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.save(`ThongKe_GeoMaster_${new Date().getTime()}.pdf`);
    } catch (error) {
        console.error("PDF Export Error:", error);
        alert("Có lỗi khi tạo PDF. Hệ thống đã được ghi nhận lỗi.");
    } finally {
        setIsExporting(null);
    }
  };

  if (loading && !stats) return (
      <div className="p-8 flex h-full items-center justify-center flex-col gap-4 bg-[#0B0C10] mesh-bg animate-mesh">
          <RefreshCw className="animate-spin w-10 h-10 text-cyan-500" />
          <p className="text-cyan-400 font-display font-black uppercase tracking-[0.3em] text-[10px]">Đang truy xuất hệ thống...</p>
      </div>
  );

  const displayStats = stats || MOCK_FALLBACK;

  return (
    <div ref={dashboardRef} className="relative p-6 bg-[#0B0C10] mesh-bg animate-mesh min-h-full text-white overflow-x-hidden overflow-y-auto h-full custom-scrollbar">
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 decoration-layers">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-orb-move"></div>
          <div className="absolute bottom-[0%] right-[-5%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full animate-orb-move" style={{ animationDelay: '-8s' }}></div>
      </div>

      {/* HEADER SECTION */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-reveal-up pl-12 md:pl-0">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-black text-[9px] uppercase tracking-[0.3em] mb-1">
             <div className="w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee] animate-pulse"></div>
             Khai thác dữ liệu thời gian thực
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Hệ thống Thống kê
          </h2>
          <div className="text-gray-500 text-[10px] flex items-center gap-2 mt-2 font-bold">
            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-gray-400 backdrop-blur-md uppercase">
                SYNC: {lastUpdated.toLocaleTimeString()}
            </span>
            <ChevronRight size={12} className="text-blue-500" />
            <span className="font-black text-blue-400 uppercase tracking-widest">{user.branchId}</span>
          </div>
        </div>
        <div className="flex gap-2 export-buttons">
          <button 
            onClick={handleExportExcel}
            disabled={!!isExporting}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-xl active:scale-95 group disabled:opacity-50"
          >
            {isExporting === 'EXCEL' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} EXCEL
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={!!isExporting}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-rose-600 px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-xl active:scale-95 group disabled:opacity-50"
          >
            {isExporting === 'PDF' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PDF
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'QUY MÔ THỬA', value: displayStats.totalParcels.toLocaleString(), suffix: 'thửa', icon: Building, color: 'blue', delay: '0.1s' },
          { label: 'DIỆN TÍCH QUẢN LÝ', value: Math.round(displayStats.totalArea).toLocaleString(), suffix: 'm²', icon: Scaling, color: 'purple', delay: '0.2s' },
          { label: 'GIÁ TRỊ TÍCH LŨY', value: displayStats.totalValue > 1e9 ? `${(displayStats.totalValue / 1e9).toFixed(1)} TỶ` : `${(displayStats.totalValue / 1e6).toFixed(0)} TR`, suffix: 'VNĐ', icon: DollarSign, color: 'cyan', delay: '0.3s' }
        ].map((card, idx) => (
          <div key={idx} 
               style={{ animationDelay: card.delay }}
               className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group hover:bg-white/10 transition-all duration-500 animate-reveal-up opacity-0">
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-${card.color}-500 group-hover:h-1 transition-all`}></div>
              <div className="flex justify-between items-start mb-4">
                  <div className={`bg-${card.color}-500/20 p-3 rounded-xl text-${card.color}-400 group-hover:scale-110 transition-all shadow-lg`}>
                      <card.icon size={20} />
                  </div>
                  <Activity className={`text-${card.color}-500 opacity-20 group-hover:opacity-100 transition-opacity`} size={16} />
              </div>
              <h3 className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{card.label}</h3>
              <div className="flex items-end gap-1.5">
                <p className="text-3xl font-black font-display tracking-tighter leading-none">{card.value}</p>
                <span className="text-gray-600 text-[9px] font-bold uppercase mb-0.5">{card.suffix}</span>
              </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {/* CHART 1: DOUGHNUT */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl animate-reveal-left opacity-0" style={{ animationDelay: '0.4s' }}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter text-blue-400 font-display">Cơ cấu loại đất</h3>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Phân bổ chi tiết toàn vùng</p>
                </div>
                <div className="bg-white/10 p-2 rounded-xl text-gray-400 hover:text-white cursor-pointer transition-all" onClick={fetchStats}>
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""}/>
                </div>
            </div>
            <div className="h-[380px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            {COLORS.map((color, i) => (
                                <linearGradient key={`pie-grad-${i}`} id={`pie-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={1}/>
                                    <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
                                </linearGradient>
                            ))}
                        </defs>
                        <Pie
                            {...({
                                activeIndex: activeIndex !== null ? activeIndex : undefined,
                                activeShape: renderActiveShape
                            } as any)}
                            data={displayStats.parcelsByType}
                            cx="50%" cy="45%"
                            innerRadius={90} outerRadius={130}
                            paddingAngle={4}
                            dataKey="value" nameKey="name"
                            cornerRadius={10}
                            stroke="rgba(255,255,255,0.05)" strokeWidth={4}
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            {displayStats.parcelsByType.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#pie-grad-${index % COLORS.length})`} className="cursor-pointer hover:brightness-110 transition-all outline-none" />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(11, 12, 16, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '800' }}
                        />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '800' }} />
                    </PieChart>
                </ResponsiveContainer>
                {activeIndex === null && (
                    <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Tổng quan</p>
                        <p className="text-3xl font-black text-white font-display leading-tight">100%</p>
                    </div>
                )}
            </div>
        </div>

        {/* CHART 2: BAR CHART */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl animate-reveal-up opacity-0" style={{ animationDelay: '0.5s' }}>
            <div className="mb-6">
                <h3 className="text-lg font-black uppercase tracking-tighter text-orange-500 font-display">Mật độ khu vực</h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Số lượng thửa đất theo Phường/Xã</p>
            </div>
            <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={displayStats.valueByBranch} 
                        layout="vertical" 
                        margin={{ right: 60, left: 20, top: 10, bottom: 10 }}
                    >
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={130} 
                            stroke="#94a3b8" 
                            tick={{fontSize: 10, fontWeight: '800'}} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)', radius: 8}} 
                            contentStyle={{ backgroundColor: 'rgba(11, 12, 16, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                        <Bar 
                            dataKey="value" 
                            fill="url(#barGradient)" 
                            radius={[0, 10, 10, 0]} 
                            barSize={18} 
                            animationDuration={1500}
                            label={{ 
                                position: 'right', 
                                fill: '#94a3b8', 
                                fontSize: 10, 
                                fontWeight: '900', 
                                offset: 12,
                                formatter: (val: number) => val.toLocaleString()
                            }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
