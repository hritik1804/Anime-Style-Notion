import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ActivityHeatmap.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface ActivityDay {
  date: string;
  count: number;
}

export const ActivityHeatmap: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<ActivityDay[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_URL}/analytics/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch activity');
      }
    };
    fetchActivity();
  }, [token]);

  // Generate last 100 days
  const days = Array.from({ length: 112 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (111 - i));
    const dateStr = d.toISOString().split('T')[0];
    const activity = data.find(a => a.date === dateStr);
    return { date: dateStr, count: activity?.count || 0 };
  });

  const getIntensity = (count: number) => {
    if (count === 0) return 'level-0';
    if (count < 3) return 'level-1';
    if (count < 6) return 'level-2';
    if (count < 10) return 'level-3';
    return 'level-4';
  };

  return (
    <div className="heatmap-container">
      <div className="heatmap-grid">
        {days.map((day) => (
          <div 
            key={day.date} 
            className={`heatmap-cell ${getIntensity(day.count)}`}
            title={`${day.date}: ${day.count} spiritual events`}
          />
        ))}
      </div>
      <div className="heatmap-labels">
        <span>Past 4 Months</span>
        <div className="heatmap-legend">
          <span>Less</span>
          <div className="heatmap-cell level-0" />
          <div className="heatmap-cell level-1" />
          <div className="heatmap-cell level-2" />
          <div className="heatmap-cell level-3" />
          <div className="heatmap-cell level-4" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
