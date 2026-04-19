export const PDF_TEMPLATE_PRESETS = {
    DEFAULT: {
        label: 'Mẫu pháp lý chuẩn',
        settings: {
            pdf_header_1: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
            pdf_header_2: 'Độc lập - Tự do - Hạnh phúc',
            pdf_title: 'TRÍCH LỤC BẢN ĐỒ ĐỊA CHÍNH',
            pdf_location_text: 'TP. Hồ Chí Minh',
            pdf_signer_title: 'Người trích lục',
            pdf_signer_name: 'HỆ THỐNG WEBGIS',
            pdf_signature_style: 'HANDWRITTEN',
            pdf_signature_width: '160',
            pdf_signature_height: '62',
            pdf_signature_image: '',
            pdf_show_signature_image: 'true',
            pdf_stamp_image: '',
            pdf_show_stamp: 'true',
            pdf_note_text: '',
            pdf_footer_text: 'Trung tâm dữ liệu GIS',
            pdf_show_qr: 'true',
            pdf_show_signer: 'true'
        }
    },
    DIGITAL: {
        label: 'Mẫu thông tin số',
        settings: {
            pdf_header_1: 'HỆ THỐNG THÔNG TIN ĐẤT ĐAI',
            pdf_header_2: 'Phiếu trích xuất dữ liệu số',
            pdf_title: 'PHIẾU THÔNG TIN THỬA ĐẤT',
            pdf_location_text: 'TP. Hồ Chí Minh',
            pdf_signer_title: 'Người xác nhận',
            pdf_signer_name: 'HỆ THỐNG WEBGIS',
            pdf_signature_style: 'DIGITAL',
            pdf_signature_width: '165',
            pdf_signature_height: '64',
            pdf_signature_image: '',
            pdf_show_signature_image: 'true',
            pdf_stamp_image: '',
            pdf_show_stamp: 'true',
            pdf_note_text: 'Thông tin được trích xuất từ hệ thống WebGIS và có giá trị tham khảo.',
            pdf_footer_text: 'Cổng thông tin đất đai số',
            pdf_show_qr: 'true',
            pdf_show_signer: 'true'
        }
    },
    COMPACT: {
        label: 'Mẫu nội bộ gọn',
        settings: {
            pdf_header_1: 'WEBGIS HỒ CHÍ MINH',
            pdf_header_2: 'Trích xuất nội bộ',
            pdf_title: 'SƠ ĐỒ THỬA ĐẤT',
            pdf_location_text: 'TP. Hồ Chí Minh',
            pdf_signer_title: 'Người lập phiếu',
            pdf_signer_name: 'HỆ THỐNG WEBGIS',
            pdf_signature_style: 'FORMAL',
            pdf_signature_width: '150',
            pdf_signature_height: '58',
            pdf_signature_image: '',
            pdf_show_signature_image: 'true',
            pdf_stamp_image: '',
            pdf_show_stamp: 'false',
            pdf_note_text: '',
            pdf_footer_text: 'Tài liệu sử dụng nội bộ',
            pdf_show_qr: 'false',
            pdf_show_signer: 'true'
        }
    }
} as const;

export type PdfTemplatePresetKey = keyof typeof PDF_TEMPLATE_PRESETS;

export const getPdfTemplatePreset = (key?: string) => {
    const normalized = String(key || 'DEFAULT').toUpperCase() as PdfTemplatePresetKey;
    return PDF_TEMPLATE_PRESETS[normalized] || PDF_TEMPLATE_PRESETS.DEFAULT;
};

export const resolvePdfTemplateSettings = (settings?: Record<string, string>): Record<string, string> => {
    const preset = getPdfTemplatePreset(settings?.pdf_template_preset);
    return {
        ...preset.settings,
        ...(settings || {})
    } as Record<string, string>;
};
