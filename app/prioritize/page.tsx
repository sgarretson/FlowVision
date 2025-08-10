'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PrioritizePage() {
  const [data, setData] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/initiatives');
      const json = await res.json();
      setData(json);
    })();
  }, []);

  const points = useMemo(
    () => data.map((d) => ({ x: d.difficulty ?? 0, y: d.roi ?? 0, name: d.title })),
    [data]
  );

  async function exportPDF() {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape' });
    const imgProps = (pdf as any).getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('prioritization.pdf');
  }

  return (
    <div className="space-y-3">
      <button onClick={exportPDF} className="px-3 py-2 rounded bg-primary text-white">Export PDF</button>
      <div ref={ref} className="h-[400px] bg-white rounded border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Difficulty" domain={[0, 100]} />
            <YAxis type="number" dataKey="y" name="ROI" domain={[0, 100]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Initiatives" data={points} fill="#007BFF" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
