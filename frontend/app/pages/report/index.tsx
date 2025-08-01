import React, { useState, useEffect } from 'react';
import { IFactory } from '@climadex/types';
import { useParams, useNavigate } from 'react-router-dom';

async function fetchReport(reportId = null) {
  const res = await fetch(`http://localhost:3000/reports/${encodeURIComponent(reportId)}`);
  const json = await res.json();
  return json;
}

export function ReportPage() {
  const [factory, setFactory] = useState<IFactory>();
  const params = useParams();
  const navigate = useNavigate();
  useEffect(() => {
   if (params.reportId)
    {
       fetchReport(params.reportId).then((json) => { 
         setFactory(() => json.factory);
       }).catch(() => {
         navigate("/*")
       });
     }
  }, [params.reportId]);

  return (
    <div>
      <p>Report page for id {factory?.factoryName}.</p>
    </div>
  );
}
