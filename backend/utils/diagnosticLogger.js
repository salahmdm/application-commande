const logs = [];

function normalize(entry) {
	const now = new Date().toISOString();
	return {
		timestamp: entry?.timestamp || now,
		type: entry?.type || 'backend-info',
		message: entry?.message || '',
		details: entry?.details || null,
		file: entry?.file || null,
		function: entry?.function || null,
		endpoint: entry?.endpoint || null,
		method: entry?.method || null,
		requestBody: entry?.requestBody || null,
		responseStatus: entry?.responseStatus ?? null,
		stack: entry?.stack || null
	};
}

function addLog(entry) {
	try {
		const normalized = normalize(entry || {});
		logs.push(normalized);
		if (logs.length > 1000) logs.shift();
	} catch (_) {}
}

function getLogs() {
	return logs.slice().reverse();
}

function clearLogs() {
	logs.length = 0;
}

module.exports = { addLog, getLogs, clearLogs };
