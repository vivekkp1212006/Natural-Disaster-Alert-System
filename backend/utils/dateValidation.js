const startOfTodayUtc = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const assertNotPastDate = (value, fieldName = 'date') => {
  if (value === undefined || value === null || value === '') {
    return { ok: true };
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, message: `${fieldName} is invalid` };
  }
  if (d < startOfTodayUtc()) {
    return { ok: false, message: `${fieldName} cannot be in the past` };
  }
  return { ok: true };
};

const assertEndAfterStart = (start, end, startField = 'startsAt', endField = 'endsAt') => {
  if (!end) return { ok: true };
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return { ok: false, message: 'Invalid date range' };
  }
  if (e < s) {
    return { ok: false, message: `${endField} must be on or after ${startField}` };
  }
  return { ok: true };
};

const assertNotPastDateTime = (value, fieldName = 'dateTime') => {
  if (value === undefined || value === null || value === '') {
    return { ok: true };
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, message: `${fieldName} is invalid` };
  }
  if (d.getTime() < Date.now() - 60000) {
    return { ok: false, message: `${fieldName} cannot be in the past` };
  }
  return { ok: true };
};

module.exports = { assertNotPastDate, assertNotPastDateTime, assertEndAfterStart, startOfTodayUtc };
