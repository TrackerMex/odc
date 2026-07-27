import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

export type SummaryExportFormat = 'pdf' | 'png'

function download(url: string, fileName: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
}

export async function exportMonthlySummarySlide(
  element: HTMLElement,
  month: string,
  format: SummaryExportFormat,
): Promise<void> {
  const image = await toPng(element, {
    backgroundColor: '#ffffff',
    cacheBust: true,
    pixelRatio: 2,
  })
  const fileName = `resumen-compras-${month}`
  if (format === 'png') {
    download(image, `${fileName}.png`)
    return
  }

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  pdf.addImage(image, 'PNG', 0, 0, pageWidth, pageHeight)
  pdf.save(`${fileName}.pdf`)
}
