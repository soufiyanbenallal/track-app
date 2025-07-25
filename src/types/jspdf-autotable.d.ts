declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    theme?: string;
    headStyles?: any;
    bodyStyles?: any;
    styles?: any;
    margin?: any;
    pageBreak?: string;
    rowPageBreak?: string;
    tableWidth?: string | number;
    showHead?: boolean;
    showFoot?: boolean;
    tableLineWidth?: number;
    tableLineColor?: string | number[];
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
} 