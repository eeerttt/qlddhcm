
/**
 * Loại bỏ dấu tiếng Việt để phục vụ tìm kiếm không dấu
 */
export const removeAccents = (str: string): string => {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd').replace(/Đ/g, 'D')
              .toLowerCase();
};

/**
 * Định dạng tiền tệ VNĐ
 * @param val Giá trị số
 * @param isVnd Nếu true, nhân với 1000 (do dữ liệu gốc lưu đơn vị nghìn đồng)
 */
export const formatCurrency = (val: number, isVnd = false): string => {
    const finalVal = isVnd ? val * 1000 : val;
    return new Intl.NumberFormat('vi-VN').format(finalVal) + (isVnd ? " VNĐ/m²" : "");
};
