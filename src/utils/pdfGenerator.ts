import jsPDF from 'jspdf';
import 'jspdf-autotable';

// تمديد نوع jsPDF لدعم autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PDFData {
  title: string;
  subtitle?: string;
  data: any[];
  columns: { header: string; dataKey: string; width?: number }[];
  summary?: { label: string; value: string }[];
  chartType?: string;
  isRTL?: boolean;
}

export class PDFGenerator {
  private doc: jsPDF;
  private isRTL: boolean;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;

  constructor(isRTL: boolean = false) {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.isRTL = isRTL;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    
    // إعداد الخط للغة العربية
    if (this.isRTL) {
      // استخدام خط يدعم العربية (في التطبيق الحقيقي يمكن إضافة خط عربي مخصص)
      this.doc.setFont('helvetica');
    }
  }

  // إضافة الهيدر
  private addHeader(title: string, subtitle?: string): number {
    let yPosition = this.margin;

    // شعار الشركة
    this.doc.setFillColor(59, 130, 246); // أزرق
    this.doc.circle(this.margin + 10, yPosition + 10, 8, 'F');
    
    // اسم الشركة
    this.doc.setFontSize(20);
    this.doc.setTextColor(59, 130, 246);
    this.doc.setFont('helvetica', 'bold');
    
    if (this.isRTL) {
      this.doc.text('StockSence', this.pageWidth - this.margin - 40, yPosition + 15, { align: 'right' });
    } else {
      this.doc.text('StockSence', this.margin + 25, yPosition + 15);
    }

    // التاريخ
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString(this.isRTL ? 'ar-SA' : 'en-US');
    
    if (this.isRTL) {
      this.doc.text(currentDate, this.margin, yPosition + 15);
    } else {
      this.doc.text(currentDate, this.pageWidth - this.margin, yPosition + 15, { align: 'right' });
    }

    yPosition += 35;

    // خط فاصل
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, yPosition, this.pageWidth - this.margin, yPosition);
    yPosition += 15;

    // عنوان التقرير
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'bold');
    
    if (this.isRTL) {
      this.doc.text(title, this.pageWidth - this.margin, yPosition, { align: 'right' });
    } else {
      this.doc.text(title, this.margin, yPosition);
    }
    
    yPosition += 15;

    // العنوان الفرعي
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFont('helvetica', 'normal');
      
      if (this.isRTL) {
        this.doc.text(subtitle, this.pageWidth - this.margin, yPosition, { align: 'right' });
      } else {
        this.doc.text(subtitle, this.margin, yPosition);
      }
      
      yPosition += 15;
    }

    return yPosition;
  }

  // إضافة ملخص البيانات
  private addSummary(summary: { label: string; value: string }[], yPosition: number): number {
    if (!summary || summary.length === 0) return yPosition;

    // عنوان الملخص
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'bold');
    
    const summaryTitle = this.isRTL ? 'ملخص التقرير' : 'Report Summary';
    if (this.isRTL) {
      this.doc.text(summaryTitle, this.pageWidth - this.margin, yPosition, { align: 'right' });
    } else {
      this.doc.text(summaryTitle, this.margin, yPosition);
    }
    
    yPosition += 15;

    // بيانات الملخص في صناديق ملونة
    const boxWidth = (this.pageWidth - 2 * this.margin - 10) / 2;
    const boxHeight = 20;
    let xPosition = this.margin;
    let currentRow = 0;

    summary.forEach((item, index) => {
      if (index % 2 === 0 && index > 0) {
        yPosition += boxHeight + 5;
        currentRow++;
      }
      
      xPosition = this.margin + (index % 2) * (boxWidth + 10);

      // صندوق ملون
      this.doc.setFillColor(245, 247, 250);
      this.doc.roundedRect(xPosition, yPosition, boxWidth, boxHeight, 3, 3, 'F');
      
      // النص
      this.doc.setFontSize(10);
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont('helvetica', 'bold');
      
      if (this.isRTL) {
        this.doc.text(item.label, xPosition + boxWidth - 5, yPosition + 8, { align: 'right' });
        this.doc.text(item.value, xPosition + boxWidth - 5, yPosition + 16, { align: 'right' });
      } else {
        this.doc.text(item.label, xPosition + 5, yPosition + 8);
        this.doc.text(item.value, xPosition + 5, yPosition + 16);
      }
    });

    return yPosition + boxHeight + 20;
  }

  // إضافة جدول البيانات
  private addTable(data: any[], columns: { header: string; dataKey: string; width?: number }[], yPosition: number): number {
    if (!data || data.length === 0) return yPosition;

    // تحضير البيانات للجدول
    const tableColumns = columns.map(col => col.header);
    const tableRows = data.map(row => 
      columns.map(col => {
        const value = row[col.dataKey];
        if (typeof value === 'number' && col.dataKey.includes('price') || col.dataKey.includes('amount') || col.dataKey.includes('value')) {
          return this.formatCurrency(value);
        }
        return value?.toString() || '';
      })
    );

    // إعدادات الجدول
    const tableOptions = {
      startY: yPosition,
      head: [tableColumns],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 5,
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: this.getColumnStyles(columns),
      margin: { left: this.margin, right: this.margin },
      tableWidth: 'auto',
      // دعم RTL
      ...(this.isRTL && {
        styles: {
          ...this.doc.autoTable.styles,
          halign: 'right',
        }
      })
    };

    this.doc.autoTable(tableOptions);

    // الحصول على الموضع الجديد بعد الجدول
    return (this.doc as any).lastAutoTable.finalY + 20;
  }

  // تنسيق أعمدة الجدول
  private getColumnStyles(columns: { header: string; dataKey: string; width?: number }[]): any {
    const styles: any = {};
    
    columns.forEach((col, index) => {
      styles[index] = {};
      
      if (col.width) {
        styles[index].cellWidth = col.width;
      }
      
      // تنسيق خاص للأرقام والعملات
      if (col.dataKey.includes('price') || col.dataKey.includes('amount') || col.dataKey.includes('value')) {
        styles[index].halign = 'right';
        styles[index].fontStyle = 'bold';
      }
      
      // تنسيق خاص للتواريخ
      if (col.dataKey.includes('date') || col.dataKey.includes('Date')) {
        styles[index].halign = 'center';
      }
    });
    
    return styles;
  }

  // تنسيق العملة
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // إضافة الفوتر
  private addFooter(): void {
    const footerY = this.pageHeight - 20;
    
    // خط فاصل
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, footerY - 10, this.pageWidth - this.margin, footerY - 10);
    
    // نص الفوتر
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFont('helvetica', 'normal');
    
    const footerText = this.isRTL 
      ? `© ${new Date().getFullYear()} StockSence - جميع الحقوق محفوظة`
      : `© ${new Date().getFullYear()} StockSence - All Rights Reserved`;
    
    this.doc.text(footerText, this.pageWidth / 2, footerY, { align: 'center' });
    
    // رقم الصفحة
    const pageNumber = this.isRTL 
      ? `صفحة ${this.doc.internal.getNumberOfPages()}`
      : `Page ${this.doc.internal.getNumberOfPages()}`;
    
    if (this.isRTL) {
      this.doc.text(pageNumber, this.margin, footerY);
    } else {
      this.doc.text(pageNumber, this.pageWidth - this.margin, footerY, { align: 'right' });
    }
  }

  // إنشاء PDF وتحميله
  public generatePDF(pdfData: PDFData): void {
    let yPosition = this.addHeader(pdfData.title, pdfData.subtitle);
    
    // إضافة الملخص إذا كان متوفراً
    if (pdfData.summary) {
      yPosition = this.addSummary(pdfData.summary, yPosition);
    }
    
    // التحقق من الحاجة لصفحة جديدة
    if (yPosition > this.pageHeight - 100) {
      this.doc.addPage();
      yPosition = this.margin;
    }
    
    // إضافة الجدول
    yPosition = this.addTable(pdfData.data, pdfData.columns, yPosition);
    
    // إضافة الفوتر
    this.addFooter();
    
    // تحميل الملف
    const fileName = `${pdfData.chartType || 'report'}-${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(fileName);
  }

  // إنشاء تقرير مخصص للفئات
  public generateCategoryReport(categoryData: any[], isRTL: boolean = false): void {
    const columns = [
      { header: isRTL ? 'الفئة' : 'Category', dataKey: 'category', width: 40 },
      { header: isRTL ? 'عدد المنتجات' : 'Products', dataKey: 'count', width: 30 },
      { header: isRTL ? 'القيمة الإجمالية' : 'Total Value', dataKey: 'value', width: 40 },
      { header: isRTL ? 'الكمية' : 'Quantity', dataKey: 'quantity', width: 30 },
      { header: isRTL ? 'متوسط السعر' : 'Avg Price', dataKey: 'avgPrice', width: 35 }
    ];

    const totalValue = categoryData.reduce((sum, cat) => sum + cat.value, 0);
    const totalProducts = categoryData.reduce((sum, cat) => sum + cat.count, 0);
    const totalQuantity = categoryData.reduce((sum, cat) => sum + cat.quantity, 0);

    const summary = [
      { label: isRTL ? 'إجمالي الفئات' : 'Total Categories', value: categoryData.length.toString() },
      { label: isRTL ? 'إجمالي المنتجات' : 'Total Products', value: totalProducts.toString() },
      { label: isRTL ? 'إجمالي القيمة' : 'Total Value', value: this.formatCurrency(totalValue) },
      { label: isRTL ? 'إجمالي الكمية' : 'Total Quantity', value: totalQuantity.toString() }
    ];

    this.generatePDF({
      title: isRTL ? 'تقرير أداء الفئات' : 'Category Performance Report',
      subtitle: isRTL ? 'تحليل شامل لأداء فئات المنتجات' : 'Comprehensive analysis of product category performance',
      data: categoryData,
      columns,
      summary,
      chartType: 'categories',
      isRTL
    });
  }

  // إنشاء تقرير مخصص للأداء الشهري
  public generatePerformanceReport(monthlyData: any[], isRTL: boolean = false): void {
    const columns = [
      { header: isRTL ? 'الشهر' : 'Month', dataKey: 'month', width: 30 },
      { header: isRTL ? 'الإيرادات' : 'Revenue', dataKey: 'revenue', width: 40 },
      { header: isRTL ? 'المبيعات' : 'Sales', dataKey: 'sales', width: 30 },
      { header: isRTL ? 'الأرباح' : 'Profit', dataKey: 'profit', width: 40 },
      { header: isRTL ? 'النمو %' : 'Growth %', dataKey: 'growth', width: 30 }
    ];

    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
    const totalSales = monthlyData.reduce((sum, month) => sum + month.sales, 0);
    const totalProfit = monthlyData.reduce((sum, month) => sum + month.profit, 0);
    const avgGrowth = monthlyData.reduce((sum, month) => sum + month.growth, 0) / monthlyData.length;

    const summary = [
      { label: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue', value: this.formatCurrency(totalRevenue) },
      { label: isRTL ? 'إجمالي المبيعات' : 'Total Sales', value: totalSales.toString() },
      { label: isRTL ? 'إجمالي الأرباح' : 'Total Profit', value: this.formatCurrency(totalProfit) },
      { label: isRTL ? 'متوسط النمو' : 'Average Growth', value: `${avgGrowth.toFixed(1)}%` }
    ];

    this.generatePDF({
      title: isRTL ? 'تقرير الأداء الشهري' : 'Monthly Performance Report',
      subtitle: isRTL ? 'تحليل الأداء المالي والمبيعات الشهرية' : 'Monthly financial and sales performance analysis',
      data: monthlyData,
      columns,
      summary,
      chartType: 'performance',
      isRTL
    });
  }

  // إنشاء تقرير شامل
  public generateFullReport(analytics: any, isRTL: boolean = false): void {
    const summary = [
      { label: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue', value: this.formatCurrency(analytics.totalRevenue) },
      { label: isRTL ? 'إجمالي المنتجات' : 'Total Products', value: analytics.totalProducts.toString() },
      { label: isRTL ? 'إجمالي المبيعات' : 'Total Sales', value: analytics.totalSales.toString() },
      { label: isRTL ? 'قيمة المخزون' : 'Inventory Value', value: this.formatCurrency(analytics.totalInventoryValue) },
      { label: isRTL ? 'المنتجات منخفضة المخزون' : 'Low Stock Items', value: analytics.lowStockItems.toString() },
      { label: isRTL ? 'نمو الإيرادات' : 'Revenue Growth', value: `${analytics.revenueGrowth}%` }
    ];

    // جدول المنتجات الأكثر مبيعاً
    const topProductsColumns = [
      { header: isRTL ? 'المنتج' : 'Product', dataKey: 'productName', width: 60 },
      { header: isRTL ? 'الكمية المباعة' : 'Quantity Sold', dataKey: 'quantity', width: 35 },
      { header: isRTL ? 'الإيرادات' : 'Revenue', dataKey: 'revenue', width: 40 }
    ];

    this.generatePDF({
      title: isRTL ? 'التقرير الشامل' : 'Comprehensive Report',
      subtitle: isRTL ? 'تقرير شامل لجميع جوانب الأعمال' : 'Complete overview of all business aspects',
      data: analytics.topProducts,
      columns: topProductsColumns,
      summary,
      chartType: 'full-report',
      isRTL
    });
  }
}