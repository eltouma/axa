import React, { useState, useEffect } from 'react';
import { IFactory } from '@climadex/types';
import { useParams, useNavigate } from 'react-router-dom';

async function fetchReport(reportId = null) {
  const res = await fetch(`http://localhost:3000/reports/${encodeURIComponent(reportId)}`);
/*
  if (!res.ok) {
	return reply.code(404).send({ error: 'Factory not found' });
   }
*/
  const json = await res.json();
  return json;
}

export function ReportPage() {
  const [factory, setFactory] = useState<IFactory>();
//  const [loading, setLoading] = useState<boolean>(true);
  const params = useParams();
  const navigate = useNavigate();
  useEffect(() => {
	if (params.reportId)
	{
		fetchReport(params.reportId).then((json) => { 
			setFactory(() => json.factory);
//			setLoading(() => false)
		}).catch(() => {
		  navigate("/*")
		});
	}
  }, [params.reportId]);

  return (
	<div>
	<p>Coucou, tu veux voir ma div</p>
	{/*{!loading && <p>Report page for id {factory?.factoryName}.</p>}*/}
	<p>Report page for id {factory?.factoryName}.</p>
	</div>
  );
}
