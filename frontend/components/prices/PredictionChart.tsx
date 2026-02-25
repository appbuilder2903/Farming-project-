'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Prediction } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PredictionChartProps {
  prediction: Prediction;
  historyData?: Array<{ date: string; modalPrice: number }>;
}

export default function PredictionChart({ prediction, historyData = [] }: PredictionChartProps) {
  const historyLabels = historyData.map((d) =>
    new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  );
  const historyPrices = historyData.map((d) => d.modalPrice);

  const predLabels = prediction.predictions.map((p) =>
    new Date(p.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  );
  const predPrices = prediction.predictions.map((p) => p.predictedPrice);
  const upperBounds = prediction.predictions.map((p) => p.upperBound);
  const lowerBounds = prediction.predictions.map((p) => p.lowerBound);

  const allLabels = [...historyLabels, ...predLabels];
  const historicalDataset = {
    label: 'Historical Price',
    data: [
      ...historyPrices,
      ...new Array(predLabels.length).fill(null),
    ],
    borderColor: '#16a34a',
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    borderWidth: 2,
    pointRadius: 3,
    pointBackgroundColor: '#16a34a',
    fill: false,
    tension: 0.4,
  };

  const predDataset = {
    label: 'Predicted Price',
    data: [
      ...new Array(historyLabels.length).fill(null),
      ...predPrices,
    ],
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 2,
    borderDash: [6, 3],
    pointRadius: 4,
    pointBackgroundColor: '#f59e0b',
    fill: false,
    tension: 0.4,
  };

  const upperDataset = {
    label: 'Upper Bound',
    data: [...new Array(historyLabels.length).fill(null), ...upperBounds],
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderDash: [3, 3],
    pointRadius: 0,
    fill: '+1',
    tension: 0.4,
  };

  const lowerDataset = {
    label: 'Lower Bound',
    data: [...new Array(historyLabels.length).fill(null), ...lowerBounds],
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderDash: [3, 3],
    pointRadius: 0,
    fill: false,
    tension: 0.4,
  };

  const data = {
    labels: allLabels,
    datasets: [historicalDataset, predDataset, upperDataset, lowerDataset],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        labels: {
          filter: (item: { text: string }) =>
            !['Upper Bound', 'Lower Bound'].includes(item.text),
          boxWidth: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
            if (ctx.parsed.y === null) return '';
            return `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v: unknown) => `₹${Number(v).toLocaleString('en-IN')}`,
          font: { size: 11 },
        },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: {
        ticks: { font: { size: 10 }, maxRotation: 45 },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="h-64 md:h-80">
      <Line data={data} options={options} />
    </div>
  );
}
