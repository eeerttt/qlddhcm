
import React from 'react';
import { LandPrice2026 } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface Props {
    data: LandPrice2026;
}

const LandPricePrintTemplate: React.FC<Props> = ({ data }) => {
    // Logic tính toán giá (Duplicate logic for display)
    const calculatePositions = (basePrice: number) => {
        return [
            { pos: 1, label: 'Vị trí 1', factor: 1, price: basePrice, desc: 'Mặt tiền đường' },
            { pos: 2, label: 'Vị trí 2', factor: 0.7, price: basePrice * 0.7, desc: 'Hẻm ≥ 5m' },
            { pos: 3, label: 'Vị trí 3', factor: 0.5, price: basePrice * 0.5, desc: 'Hẻm 3m - <5m' },
            { pos: 4, label: 'Vị trí 4', factor: 0.35, price: basePrice * 0.35, desc: 'Hẻm < 3m' },
        ];
    };

    const RenderTable = ({ title, price }: { title: string, price: number }) => (
        <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', color: '#000000' }}>{title}</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#000000' }}>
                <thead>
                    <tr style={{ backgroundColor: '#e0e0e0' }}>
                        <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', width: '50px', fontWeight: 'bold' }}>VT</th>
                        <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>Mô tả</th>
                        <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', width: '70px', fontWeight: 'bold' }}>Hệ số</th>
                        <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'right', width: '140px', fontWeight: 'bold' }}>Đơn giá (VNĐ/m²)</th>
                    </tr>
                </thead>
                <tbody>
                    {calculatePositions(price).map((row) => (
                        <tr key={row.pos}>
                            <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{row.pos}</td>
                            <td style={{ border: '1px solid #000000', padding: '6px' }}>{row.desc}</td>
                            <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{row.factor * 100}%</td>
                            <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                {formatCurrency(row.price, true).replace(' VNĐ/m²', '')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div id="land-price-print-template" style={{
            width: '794px', // A4 Width pixels (96 DPI)
            minHeight: '1123px', // A4 Height pixels
            padding: '40px 50px',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: '"Times New Roman", Times, serif',
            position: 'fixed',
            top: 0,
            left: '-10000px',
            zIndex: -1000,
            visibility: 'visible'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#000000' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '5px 0 20px 0', textDecoration: 'underline', color: '#000000' }}>Độc lập - Tự do - Hạnh phúc</p>
                
                <h1 style={{ fontSize: '22px', fontWeight: '900', marginTop: '30px', color: '#000000' }}>KẾT QUẢ TRA CỨU GIÁ ĐẤT 2026</h1>
                <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#000000' }}>Thời điểm xuất: {new Date().toLocaleString('vi-VN')}</p>
            </div>

            {/* General Info */}
            <div style={{ marginBottom: '30px', border: '2px solid #000000', padding: '15px' }}>
                <table style={{ width: '100%', fontSize: '14px', color: '#000000' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '4px', width: '110px', fontWeight: 'bold', verticalAlign: 'top' }}>Tên đường:</td>
                            <td style={{ padding: '4px', fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase' }}>{data.tenduong}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4px', fontWeight: 'bold', verticalAlign: 'top' }}>Khu vực:</td>
                            <td style={{ padding: '4px' }}>{data.phuongxa} (Tỉnh cũ: {data.tinhcu})</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4px', fontWeight: 'bold', verticalAlign: 'top' }}>Đoạn đường:</td>
                            <td style={{ padding: '4px' }}>Từ <b>{data.tu || 'Đầu đường'}</b> đến <b>{data.den || 'Cuối đường'}</b></td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4px', fontWeight: 'bold', verticalAlign: 'top' }}>Năm áp dụng:</td>
                            <td style={{ padding: '4px', fontWeight: 'bold' }}>{data.nam_ap_dung}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Price Tables */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', borderBottom: '2px solid #000000', paddingBottom: '5px', marginBottom: '20px', color: '#000000' }}>CHI TIẾT BẢNG GIÁ</h3>
                
                <RenderTable title="1. Đất Ở (ODT)" price={data.dato} />
                <RenderTable title="2. Đất Thương Mại Dịch Vụ (TMDV)" price={data.dattmdv} />
                <RenderTable title="3. Đất Sản Xuất Kinh Doanh (SXKD)" price={data.datsxkdpnn} />
            </div>

            {/* Footer */}
            <div style={{ marginTop: '40px', textAlign: 'right', pageBreakInside: 'avoid' }}>
                <p style={{ fontSize: '14px', fontStyle: 'italic', marginBottom: '5px', color: '#000000' }}>TP. Hồ Chí Minh, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                <p style={{ fontSize: '13px', fontWeight: 'bold', marginRight: '40px', color: '#000000' }}>NGƯỜI TRA CỨU</p>
                <div style={{ height: '70px' }}></div>
                <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#000000', marginRight: '20px' }}>(Ký và ghi rõ họ tên)</p>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid #000000', paddingTop: '10px', fontSize: '11px', textAlign: 'center', color: '#000000', fontStyle: 'italic' }}>
                Hệ thống WebGIS GeoMaster - Dữ liệu mang tính chất tham khảo.
            </div>
        </div>
    );
};

export default LandPricePrintTemplate;
